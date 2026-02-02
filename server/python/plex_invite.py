from flask import Flask, request, jsonify
from plexapi.myplex import MyPlexAccount
import traceback
import logging
from datetime import datetime, timezone
import os
import json
import requests
import time
import sys

config_dir = os.environ.get('CONFIG_DIRECTORY', '/app/config')
log_dir = os.path.join(config_dir, 'logs')
log_path = os.path.join(log_dir, '.machinelogs.json')

class JSONLineLogger:
    def __init__(self, label='Plex Sync'):
        self.label = label
        self.log_path = log_path
    def _write(self, level, message, data=None):
        log_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
            'level': level,
            'label': self.label,
            'message': message,
        }
        if data:
            log_entry['data'] = data
        try:
            with open(self.log_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            # Fallback to stderr if file logging fails
            print(f"[{level.upper()}][{self.label}] {message} {json.dumps(data) if data else ''}", file=sys.stderr)
    def info(self, message, data=None):
        self._write('info', message, data)
    def error(self, message, data=None):
        self._write('error', message, data)

logger = JSONLineLogger()

app = Flask(__name__)

@app.route('/invite', methods=['POST'])
def invite():
    data = request.json
    token = data.get('token')
    server_id = data.get('server_id')
    email = data.get('email')
    libraries = data.get('libraries', [])
    allow_sync = data.get('allow_sync', False)
    allow_camera_upload = data.get('allow_camera_upload', False)
    allow_channels = data.get('allow_channels', False)
    plex_home = data.get('plex_home', False)
    user_token = data.get('user_token')  # Optional: token of the user being invited for auto-accept

    try:
        account = MyPlexAccount(token=token)
    except Exception as e:
        logger.error('Failed to authenticate with Plex', {'error': str(e)})
        return jsonify({'success': False, 'error': 'Failed to authenticate with Plex'}), 401

    try:
        # Get section info from Plex API directly (no server connection needed)
        plex_sections_url = f'https://plex.tv/api/servers/{server_id}'
        headers = {'X-Plex-Token': token, 'Accept': 'application/xml'}
        sections_response = requests.get(plex_sections_url, headers=headers, timeout=10)
        sections_response.raise_for_status()

        # Parse the XML response to get section info
        import xml.etree.ElementTree as ET
        root = ET.fromstring(sections_response.text)

        # Build mappings of section key to title (key is what Node.js sends)
        key_to_title = {}
        all_section_names = []
        for section in root.findall('.//Section'):
            title = section.get('title')
            section_key = section.get('key') or section.get('id')
            if title and section_key:
                key_to_title[section_key] = title
                all_section_names.append(title)

        # Select libraries: grant all if empty, else filter by specific IDs
        if not libraries or libraries == '' or (isinstance(libraries, list) and len(libraries) == 0):
            section_names = all_section_names
        else:
            library_ids = [lib_id.strip() for lib_id in libraries.split(',')] if isinstance(libraries, str) else [str(lib_id) for lib_id in libraries]
            section_names = []
            for lib_id in library_ids:
                if lib_id in key_to_title:
                    section_names.append(key_to_title[lib_id])
                else:
                    logger.error('Invalid library section ID', {'library_id': lib_id})
                    return jsonify({'success': False, 'error': f'Invalid library section ID: {lib_id}'}), 400

    except Exception as e:
        logger.error('Failed to get section info from Plex API', {'error': str(e)})
        return jsonify({'success': False, 'error': 'Failed to get library sections'}), 400

    try:
        if plex_home:
            account.createExistingUser(
                user=email,
                server=server_id,
                sections=section_names,
                allowSync=allow_sync,
                allowChannels=allow_channels,
                allowCameraUpload=allow_camera_upload
            )
            message = 'Plex Home user created. Plex Home email invitation sent.'
        else:
            account.inviteFriend(
                email,
                server=server_id,
                sections=section_names,
                allowSync=allow_sync,
                allowCameraUpload=allow_camera_upload,
                allowChannels=allow_channels
            )
            message = 'User invited successfully.'

            if user_token:
                try:
                    time.sleep(3)
                    user_account = MyPlexAccount(token=user_token)
                    pending_invites = user_account.pendingInvites()

                    if pending_invites and len(pending_invites) > 0:
                        user_account.acceptInvite(pending_invites[0])
                        message = 'User invited and automatically accepted.'
                except Exception as accept_error:
                    logger.error('Unable to auto-accept invite', {
                        'email': email,
                        'error': str(accept_error)
                    })

        return jsonify({'success': True, 'message': message})
    except Exception as e:
        logger.error('Invite error', {'error': str(e)})
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/libraries', methods=['GET', 'POST'])
def libraries():
    if request.method == 'GET':
        # GET request - get user's current library access
        token = request.args.get('token')
        server_id = request.args.get('server_id')
        email = request.args.get('email')
    else:
        # POST request - update user's library access
        data = request.json
        token = data.get('token')
        server_id = data.get('server_id')
        email = data.get('email')

    try:
        account = MyPlexAccount(token=token)

        # Get the user first
        account_users = account.users()
        target_user = None
        for user in account_users:
            # Check if both user.email and email are not None before comparing
            if user.email and email and user.email.lower() == email.lower():
                target_user = user
                break

        if not target_user:
            logger.error(f'User not found in account friends: {email}', {
                'email': email,
                'available_users': [
                    {'email': user.email, 'title': getattr(user, 'title', 'N/A')}
                    for user in account_users if user.email
                ]
            })
            return jsonify({'success': False, 'error': 'User not found in account friends'}), 404

        if request.method == 'GET':
            # Get user's current library access from their server permissions
            user_sections = []

            for server in target_user.servers:
                if server.machineIdentifier == server_id:
                    # Check if user has unrestricted access to all libraries
                    if getattr(server, 'allLibraries', False):
                        user_sections = []  # Empty = all libraries
                    else:
                        # Filter to only sections that are actually shared with the user
                        sections_list = list(server.sections())
                        user_sections = [str(s.key) for s in sections_list if getattr(s, 'shared', True)]
                    break

            # Get user-level permissions
            return jsonify({
                'success': True,
                'libraries': user_sections,
                'permissions': {
                    'allowSync': getattr(target_user, 'allowSync', False) or False,
                    'allowCameraUpload': getattr(target_user, 'allowCameraUpload', False) or False,
                    'allowChannels': getattr(target_user, 'allowChannels', False) or False
                }
            })

        elif request.method == 'POST':
            # Update user library access
            data = request.json
            libraries = data.get('libraries', [])
            allow_sync = data.get('allow_sync', None)
            allow_camera_upload = data.get('allow_camera_upload', None)
            allow_channels = data.get('allow_channels', None)

            # Get section info from user's server share
            user_server = None
            for server in target_user.servers:
                if server.machineIdentifier == server_id:
                    user_server = server
                    break

            if not user_server:
                logger.error('Server not found in user shares', {'server_id': server_id})
                return jsonify({'success': False, 'error': 'Server not found in user shares'}), 404

            try:
                # Get all available sections from user's server share
                all_sections = list(user_server.sections())
                id_to_title = {str(section.key): section.title for section in all_sections}

                # Select libraries: grant all if empty array/null, else filter by specific IDs
                if not libraries or libraries == '' or (isinstance(libraries, list) and len(libraries) == 0):
                    # Grant all libraries
                    section_names = [section.title for section in all_sections]
                else:
                    if isinstance(libraries, str):
                        library_ids = [lib_id.strip() for lib_id in libraries.split(',') if lib_id.strip()]
                    else:
                        library_ids = [str(lib_id) for lib_id in libraries]

                    # Map library IDs to names
                    section_names = []
                    for lib_id in library_ids:
                        if lib_id in id_to_title:
                            section_names.append(id_to_title[lib_id])
                        else:
                            logger.error(f'Library ID {lib_id} not found in user sections')
                            return jsonify({'success': False, 'error': f'Invalid library section ID: {lib_id}'}), 400

            except Exception as e:
                logger.error('Failed to get section info', {'error': str(e)})
                return jsonify({'success': False, 'error': 'Failed to get section info'}), 400

            # Get the sharing ID from the user's server share
            sharing_id = user_server.id

            # Get section IDs for the API call
            # We need to call the Plex API to get section IDs from names
            try:
                plex_sections_url = f'https://plex.tv/api/servers/{server_id}'
                headers = {
                    'X-Plex-Token': token,
                    'Accept': 'application/xml'
                }
                sections_response = requests.get(plex_sections_url, headers=headers, timeout=10)
                sections_response.raise_for_status()

                # Parse the XML response to get section IDs
                import xml.etree.ElementTree as ET
                root = ET.fromstring(sections_response.text)

                # Build a mapping of section title to section id
                title_to_id = {}
                for section in root.findall('.//Section'):
                    title = section.get('title', '').lower()
                    section_id = section.get('id')
                    if title and section_id:
                        title_to_id[title] = int(section_id)

                # Convert section names to IDs
                section_ids = []
                for name in section_names:
                    name_lower = name.lower()
                    if name_lower in title_to_id:
                        section_ids.append(title_to_id[name_lower])
                    else:
                        logger.error(f'Section name not found: {name}')
                        return jsonify({'success': False, 'error': f'Section not found: {name}'}), 400

            except Exception as e:
                logger.error('Failed to get section IDs from Plex API', {'error': str(e)})
                return jsonify({'success': False, 'error': 'Failed to get section IDs'}), 500

            # Get current user permissions to check if they've changed
            current_allow_sync = getattr(target_user, 'allowSync', False) or False
            current_allow_camera_upload = getattr(target_user, 'allowCameraUpload', False) or False
            current_allow_channels = getattr(target_user, 'allowChannels', False) or False

            # Determine if permissions have changed
            permissions_changed = (
                (allow_sync is not None and allow_sync != current_allow_sync) or
                (allow_camera_upload is not None and allow_camera_upload != current_allow_camera_upload) or
                (allow_channels is not None and allow_channels != current_allow_channels)
            )

            # Update using the correct API endpoint
            try:
                update_url = f'https://plex.tv/api/servers/{server_id}/shared_servers/{sharing_id}'

                headers = {
                    'X-Plex-Token': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }

                # Helper function to get appropriate error status code
                def get_error_status(status_code):
                    return status_code if status_code >= 400 else 500

                # First, update the library sections via PUT
                sections_payload = {
                    'server_id': server_id,
                    'shared_server': {
                        'library_section_ids': section_ids
                    }
                }

                update_response = requests.put(update_url, json=sections_payload, headers=headers, timeout=15)

                # Ensure the library section update succeeded
                if update_response.status_code not in [200, 204]:
                    logger.error('Failed to update shared server library sections', {
                        'email': email,
                        'status_code': update_response.status_code,
                        'response_text': update_response.text
                    })
                    return jsonify({
                        'success': False,
                        'error': 'Failed to update library access on Plex (library sections update failed).'
                    }), get_error_status(update_response.status_code)

                # Only DELETE and re-POST the share if permissions have actually changed
                # This is the only reliable way to update allowSync/allowChannels/allowCameraUpload
                if permissions_changed:
                    delete_response = requests.delete(update_url, headers=headers, timeout=15)

                    # Ensure the delete succeeded before recreating the share
                    if delete_response.status_code not in [200, 204]:
                        logger.error('Failed to delete existing shared server before recreating', {
                            'email': email,
                            'status_code': delete_response.status_code,
                            'response_text': delete_response.text
                        })
                        return jsonify({
                            'success': False,
                            'error': 'Failed to update library access on Plex (could not delete existing share).'
                        }), get_error_status(delete_response.status_code)

                    # Recreate the share with the correct permissions
                    create_url = f'https://plex.tv/api/servers/{server_id}/shared_servers'
                    create_payload = {
                        'server_id': server_id,
                        'shared_server': {
                            'library_section_ids': section_ids,
                            'invited_id': target_user.id
                        },
                        'sharing_settings': {
                            'allowSync': '1' if allow_sync else '0',
                            'allowCameraUpload': '1' if allow_camera_upload else '0',
                            'allowChannels': '1' if allow_channels else '0',
                            'filterMovies': '',
                            'filterTelevision': '',
                            'filterMusic': ''
                        }
                    }

                    create_response = requests.post(create_url, json=create_payload, headers=headers, timeout=15)

                    # Ensure the share recreation succeeded
                    if create_response.status_code not in [200, 204]:
                        logger.error('Failed to recreate shared server with updated permissions', {
                            'email': email,
                            'status_code': create_response.status_code,
                            'response_text': create_response.text
                        })
                        return jsonify({
                            'success': False,
                            'error': 'Failed to update library access on Plex (share recreation failed).'
                        }), get_error_status(create_response.status_code)

                return jsonify({
                    'success': True,
                    'message': 'User library access updated successfully.',
                    'libraries_shared': len(section_names),
                    'permissions_updated': permissions_changed
                })

            except Exception as update_error:
                logger.error('Failed to update library access', {
                    'email': email,
                    'error': str(update_error),
                    'traceback': traceback.format_exc()
                })
                return jsonify({
                    'success': False,
                    'error': f'Failed to update library access: {str(update_error)}'
                }), 500

    except Exception as e:
        logger.error(f'Libraries {request.method} error', {'error': str(e)})
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/pin-libraries', methods=['POST'])
def pin_libraries():
    data = request.json
    user_token = data.get('user_token')
    server_id = data.get('server_id')
    libraries_to_pin = data.get('libraries', [])
    server_name = data.get('server_name', 'Streamarr')

    if not user_token or not server_id:
        return jsonify({'success': False, 'error': 'Missing required parameters'}), 400

    if not libraries_to_pin:
        return jsonify({'success': False, 'error': 'No libraries specified'}), 400

    try:
        get_params = {
            'sharedSettings': '1',
            'X-Plex-Product': 'Plex Web',
            'X-Plex-Version': '4.152.0',
            'X-Plex-Client-Identifier': 'streamarr',
            'X-Plex-Token': user_token
        }
        headers = {
            'Accept': 'application/json'
        }
        response = requests.get(
            'https://clients.plex.tv/api/v2/user/settings',
            params=get_params,
            headers=headers,
            timeout=15
        )

        if response.status_code == 200:
            try:
                current_settings = response.json()
            except Exception as json_error:
                logger.error('Failed to parse Plex settings response', {
                    'status_code': response.status_code,
                    'response_text': response.text[:500],
                    'error': str(json_error)
                })
                return jsonify({
                    'success': False,
                    'error': f'Failed to parse Plex response: {str(json_error)}',
                    'response_preview': response.text[:200]
                }), 500
        else:
            current_settings = {}

        existing_pinned = []
        experience_data = {}

        if current_settings and 'value' in current_settings:
            for setting in current_settings['value']:
                if setting.get('id') == 'experience':
                    experience_value = json.loads(setting.get('value', '{}'))
                    experience_data = experience_value
                    existing_pinned = experience_value.get('sidebarSettings', {}).get('pinnedSources', [])
                    break

        preserved_pins = [
            pin for pin in existing_pinned
            if pin.get('machineIdentifier') != server_id
        ]

        movies_and_shows = [lib for lib in libraries_to_pin if lib['type'] in ['movie', 'show']]
        music = [lib for lib in libraries_to_pin if lib['type'] == 'artist']

        movies_and_shows.sort(key=lambda x: int(x['id']))
        music.sort(key=lambda x: int(x['id']))

        sorted_libraries = movies_and_shows + music

        our_pinned_sources = []
        for lib in sorted_libraries:
            type_mapping = {
                'movie': 'movies',
                'show': 'tv',
                'artist': 'music'
            }
            source_type = type_mapping.get(lib['type'], lib['type'])
            our_pinned_sources.append({
                'key': f"source--{source_type}--{server_id}--com.plexapp.plugins.library--{lib['id']}",
                'sourceType': source_type,
                'machineIdentifier': server_id,
                'providerIdentifier': 'com.plexapp.plugins.library',
                'directoryID': lib['id'],
                'title': lib['name'],
                'serverFriendlyName': server_name,
                'serverSourceTitle': None,
                'isFullOwnedServer': True,
                'hiddenAt': None
            })

        discover_watchlist_defaults = [
            {
                'key': 'source--discover--myPlex--tv.plex.provider.discover--home',
                'sourceType': 'discover',
                'machineIdentifier': 'myPlex',
                'providerIdentifier': 'tv.plex.provider.discover',
                'directoryID': 'home',
                'directoryIcon': 'https://provider-static.plex.tv/icons/discover-560.svg',
                'title': 'Discover',
                'serverFriendlyName': 'plex.tv',
                'providerSourceTitle': None,
                'isCloud': True,
                'isFullOwnedServer': False,
                'hiddenAt': None
            },
            {
                'key': 'source--watchlist--myPlex--tv.plex.provider.discover--watchlist',
                'sourceType': 'watchlist',
                'machineIdentifier': 'myPlex',
                'providerIdentifier': 'tv.plex.provider.discover',
                'directoryID': 'watchlist',
                'directoryIcon': 'https://provider-static.plex.tv/icons/watchlist.svg',
                'title': 'Watchlist',
                'serverFriendlyName': 'plex.tv',
                'providerSourceTitle': None,
                'isCloud': True,
                'isFullOwnedServer': False,
                'hiddenAt': None
            }
        ]

        final_pinned_sources = preserved_pins.copy()
        final_pinned_sources.extend(our_pinned_sources)
        existing_keys = {pin.get('key') for pin in final_pinned_sources}
        for default_source in discover_watchlist_defaults:
            if default_source['key'] not in existing_keys:
                final_pinned_sources.append(default_source)

        if 'sidebarSettings' not in experience_data:
            experience_data['sidebarSettings'] = {}

        experience_data['sidebarSettings']['hasCompletedSetup'] = True
        experience_data['sidebarSettings']['pinnedSources'] = final_pinned_sources

        payload = {
            'value': json.dumps([{
                'id': 'experience',
                'type': 'json',
                'value': json.dumps(experience_data),
                'hidden': False
            }])
        }

        post_params = {
            'sharedSettings': '1',
            'X-Plex-Product': 'Plex Web',
            'X-Plex-Version': '4.152.0',
            'X-Plex-Client-Identifier': 'streamarr-pin-libraries',
            'X-Plex-Token': user_token
        }
        headers = {
            'Content-Type': 'application/json'
        }
        update_response = requests.post(
            'https://clients.plex.tv/api/v2/user/settings',
            params=post_params,
            headers=headers,
            json=payload,
            timeout=15
        )

        if update_response.status_code in [200, 201]:
            return jsonify({
                'success': True,
                'message': 'Libraries pinned successfully',
                'pinned_count': len(our_pinned_sources)
            })
        else:
            logger.error('Failed to update pinned libraries', {
                'status_code': update_response.status_code,
                'response': update_response.text[:500]
            })
            return jsonify({
                'success': False,
                'error': f'Failed to update settings: {update_response.status_code}',
                'details': update_response.text
            }), update_response.status_code

    except Exception as e:
        logger.error('Pin libraries error', {'error': str(e)})
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/library-details', methods=['GET'])
def library_details():
    token = request.args.get('token')
    server_id = request.args.get('server_id')
    email = request.args.get('email')

    if not all([token, server_id, email]):
        return jsonify({'success': False, 'error': 'Missing required parameters'}), 400

    try:
        account = MyPlexAccount(token=token)
        account_users = list(account.users())

        target_user = None
        for user in account_users:
            if user.email and user.email.lower() == email.lower():
                target_user = user
                break

        if not target_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        library_details = []
        for server in target_user.servers:
            if server.machineIdentifier == server_id:
                sections_list = list(server.sections())
                for section in sections_list:
                    library_details.append({
                        'id': str(section.key),
                        'name': section.title,
                        'type': section.type
                    })
                break

        return jsonify({
            'success': True,
            'libraries': library_details
        })

    except Exception as e:
        logger.error('Library details error', {'error': str(e)})
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)
