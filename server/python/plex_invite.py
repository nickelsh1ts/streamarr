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

config_dir = os.environ.get(
    'CONFIG_DIRECTORY',
    os.path.join(os.path.dirname(__file__), '../../config'),
)
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
        server_resource = next(s for s in account.resources() if s.clientIdentifier == server_id)
        plex_server = server_resource.connect(timeout=15)
    except Exception as e:
        logger.error('Server not found or connection failed', {'error': str(e)})
        return jsonify({'success': False, 'error': 'Server not found or connection failed'}), 404

    try:
        # Select libraries: grant all if empty array/null, else filter by specific IDs
        if not libraries or libraries == '' or (isinstance(libraries, list) and len(libraries) == 0):
            selected_sections = plex_server.library.sections()
        else:
            if isinstance(libraries, str):
                library_ids = [lib_id.strip() for lib_id in libraries.split(',') if lib_id.strip()]
            else:
                library_ids = [str(lib_id) for lib_id in libraries]

            all_sections = plex_server.library.sections()
            id_to_section = {str(section.key): section for section in all_sections}
            selected_sections = [id_to_section[lib_id] for lib_id in library_ids if lib_id in id_to_section]

            if len(selected_sections) != len(library_ids):
                logger.error('Invalid library section IDs', {'library_ids': libraries})
                return jsonify({'success': False, 'error': 'Invalid library section IDs'}), 400
        section_names = [section.title for section in selected_sections]
    except Exception as e:
        logger.error('Invalid library section IDs', {'error': str(e)})
        return jsonify({'success': False, 'error': 'Invalid library section IDs'}), 400

    try:
        if plex_home:
            account.createExistingUser(
                user=email,
                server=plex_server,
                sections=section_names,
                allowSync=allow_sync,
                allowChannels=allow_channels,
                allowCameraUpload=allow_camera_upload
            )
            message = 'Plex Home user created. Plex Home email invitation sent.'
        else:
            account.inviteFriend(
                email,
                server=plex_server,
                sections=section_names,
                allowSync=allow_sync,
                allowCameraUpload=allow_camera_upload,
                allowChannels=allow_channels
            )
            message = 'User invited successfully. Will attempt to auto-accept if user_token is provided.'

            if user_token:
                try:
                    time.sleep(3)

                    user_account = MyPlexAccount(token=user_token)

                    pending_invites = user_account.pendingInvites()

                    if pending_invites and len(pending_invites) > 0:
                        matching_invite = pending_invites[0]

                        user_account.acceptInvite(matching_invite)

                        logger.info('Invite auto-accepted successfully', {
                            'email': email,
                            'invite_id': matching_invite.id
                        })
                        message = 'User Invited successfully and automatically accepted.'
                    else:
                        logger.info('No pending invites found to accept', {
                            'email': email
                        })

                except Exception as accept_error:
                    logger.error('Unable to auto-accept invite', {
                        'email': email,
                        'error': str(accept_error),
                        'traceback': traceback.format_exc()
                    })

        return jsonify({'success': True, 'message': message})
    except Exception as e:
        logger.error('Invite error', {'error': str(e)})
        traceback.print_exc()
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
            user_has_all_libraries = False

            for server in target_user.servers:
                if server.machineIdentifier == server_id:
                    # Check if user has unrestricted access to all libraries
                    user_has_all_libraries = getattr(server, 'allLibraries', False)

                    # Get sections the user can access
                    sections_list = list(server.sections())
                    user_section_ids = [str(section.key) for section in sections_list]

                    # Get all sections available on the server for comparison
                    try:
                        server_resource = next(s for s in account.resources() if s.clientIdentifier == server_id)
                        plex_server = server_resource.connect(timeout=15)
                        all_server_sections = list(plex_server.library.sections())
                        all_server_section_ids = [str(section.key) for section in all_server_sections]
                    except Exception as e:
                        logger.error(f'Could not get server sections for comparison: {str(e)}')
                        all_server_section_ids = []

                    # Determine if user has restricted access
                    if user_has_all_libraries or len(user_section_ids) == len(all_server_section_ids):
                        # User has unrestricted access - return empty array to indicate "all"
                        user_sections = []
                    else:
                        # User has restricted access - return specific sections
                        user_sections = user_section_ids
                    break

            return jsonify({
                'success': True,
                'libraries': user_sections
            })

        elif request.method == 'POST':
            # Update user library access
            data = request.json
            libraries = data.get('libraries', [])
            allow_sync = data.get('allow_sync', None)
            allow_camera_upload = data.get('allow_camera_upload', None)
            allow_channels = data.get('allow_channels', None)

            try:
                server_resource = next(s for s in account.resources() if s.clientIdentifier == server_id)
                plex_server = server_resource.connect(timeout=15)
            except Exception as e:
                logger.error('Server not found or connection failed', {'error': str(e)})
                return jsonify({'success': False, 'error': 'Server not found or connection failed'}), 404

            try:
                # Select libraries: grant all if empty array/null, else filter by specific IDs
                if not libraries or libraries == '' or (isinstance(libraries, list) and len(libraries) == 0):
                    selected_sections = plex_server.library.sections()
                else:
                    if isinstance(libraries, str):
                        library_ids = [lib_id.strip() for lib_id in libraries.split(',') if lib_id.strip()]
                    else:
                        library_ids = [str(lib_id) for lib_id in libraries]

                    all_sections = plex_server.library.sections()
                    id_to_section = {str(section.key): section for section in all_sections}
                    selected_sections = [id_to_section[lib_id] for lib_id in library_ids if lib_id in id_to_section]

                    if len(selected_sections) != len(library_ids):
                        logger.error('Invalid library section IDs', {'library_ids': libraries})
                        return jsonify({'success': False, 'error': 'Invalid library section IDs'}), 400

                section_names = [section.title for section in selected_sections]
            except Exception as e:
                logger.error('Invalid library section IDs', {'error': str(e)})
                return jsonify({'success': False, 'error': 'Invalid library section IDs'}), 400

            # Update user library access using updateFriend
            try:
                account.updateFriend(
                    user=target_user,
                    server=plex_server,
                    sections=section_names,
                    allowSync=allow_sync,
                    allowCameraUpload=allow_camera_upload,
                    allowChannels=allow_channels
                )

                return jsonify({
                    'success': True,
                    'message': 'User library access updated successfully.',
                    'libraries_shared': len(selected_sections)
                })

            except Exception as update_error:
                # Plex API often returns 404 for successful updateFriend calls
                if '404' in str(update_error) or 'not_found' in str(update_error):
                    return jsonify({
                        'success': True,
                        'message': 'User library access updated successfully.',
                        'libraries_shared': len(selected_sections)
                    })
                else:
                    logger.error(f'updateFriend failed for user {email}: {str(update_error)}')
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
