from flask import Flask, request, jsonify
from plexapi.myplex import MyPlexAccount
import traceback
import logging
from datetime import datetime, timezone
import os
import json

log_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../config/logs/.machinelogs.json'))
class JSONLineLogger:
    def __init__(self, label='Signup'):
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
        with open(self.log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry) + '\n')
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

    try:
        account = MyPlexAccount(token=token)
        server_resource = next(s for s in account.resources() if s.clientIdentifier == server_id)
        plex_server = server_resource.connect()
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
            return jsonify({'success': True, 'message': 'Plex Home user created. Plex Home email invitation sent.'})
        account.inviteFriend(
            email,
            server=plex_server,
            sections=section_names,
            allowSync=allow_sync,
            allowCameraUpload=allow_camera_upload,
            allowChannels=allow_channels
        )
        return jsonify({'success': True, 'message': 'Invite sent. Please visit /watch/web/index.html#!/settings/manage-library-access to accept.'})
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
                        plex_server = server_resource.connect()
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
            allow_sync = data.get('allow_sync', False)
            allow_camera_upload = data.get('allow_camera_upload', False)
            allow_channels = data.get('allow_channels', False)

            try:
                server_resource = next(s for s in account.resources() if s.clientIdentifier == server_id)
                plex_server = server_resource.connect()
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
                    sections=selected_sections,
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)
