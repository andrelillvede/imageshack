/**
 * Imageshack api (http://api.imageshack.us)
 * Check documentation on above adress for more info on parameters and response models
 *
 */

Imageshack = function (username, password, api_key) {
	var FormData = Npm.require('form-data');
	Future = Npm.require('fibers/future');

	var auth_token = getAuthToken();

	function getAuthToken() {
		return HTTP.post('https://api.imageshack.com/v2/user/login', {
			params: {
				username: username,
				password: password
			}
		}).data.result.auth_token
	}


	function post(url, params) {
		var form = new FormData();

		form.append('api_key', api_key);
		form.append('auth_token', auth_token);

		params.forEach(function (param) {
			form.append(param.name, param.value, param.options)
		});

		var fut = new Future();

		form.submit(url, function (err, res) {

			var body = "";

			if (err) {
				fut.throw(err);
				return
			}

			res.on('data', function (chunk) {
				body += chunk;
			});

			res.on('end', function () {
				try {
					fut.return(JSON.parse(body).result)
				} catch (e) {
					fut.throw(e);
				}
			})

		});

		return fut.wait();
	}

	function httpCall(method, url, params, authenticate) {

		if (!authenticate && typeof params == 'boolean') {
			authenticate = params;
			params = {};
		}

		params = params || {};

		if (authenticate) {
			params.auth_token = auth_token;
		}

		return JSON.parse(HTTP.call(method, url, {params: params}).content).result
	}

	/**
	 * Upload image
	 *
	 *  filename: original filename
	 *  buffer: node buffer
	 *  options: an options object containing any or all:
	 *      - album: Album title or album id to attach files to. If album exists files will be added. If not a new album will be created.
	 *      - title: Set a title for the image.
	 *      - description: Set a description for the image.
	 *      - tags: List of tags to attach to the image. csv
	 *      - public: Sets public setting. Default is true.
	 *      - filter: User specified image filter 0-23. 0 is no filter. Will be applied images transloaded.
	 *      - comments_disabled: Disable comments for the specific image
	 */
	this.uploadImage = function (filename, buffer, options) {
		var params = [{
			name: 'file@',
			value: buffer,
			options: {filename: filename, contentType: 'application/octet-stream'}
		}];

		if (options) {
			Object.keys(options).forEach(function (key) {
				params.push({
					name: key,
					value: options[key]
				})
			})
		}
		return post('https://api.imageshack.com/v2/images', params);
	}

	/**
	 * Transload image(s)
	 * urls: string of urls to transload
	 * options: an options object containing any or all:
	 *      - album: Album title or album id to attach files to. If album exists files will be added. If not a new album will be created.
	 *      - title or titles: Set a title for the image. csv if titles
	 *      - description or descriptions: Set description for the image. csv if descriptions
	 *      - tags: List of tags to attach to the image. csv
	 *      - public: Sets public setting. Default is true.
	 *      - filter: User specified image filter 0-23. 0 is no filter. Will be applied images transloaded.
	 *      - comments_disabled: Disable comments for the specific image
	 */
	this.transloadImages = function (urls, options) {

		var params = [{
			name: 'urls',
			value: urls
		}];

		if (options) {
			Object.keys(options).forEach(function (key) {
				params.push({
					name: key,
					value: options[key]
				})
			})
		}
		return post('https://api.imageshack.com/v2/images', params);
	}

	/**
	 * Get image
	 * id: image id
	 * options: an options object containing any or all:
	 *      - next_prev_limit: Sets the limit of next and previous images returned. Default is 2
	 *      - related_images_limit: Sets the limit of related images to be returned. Default is 10
	 */
	this.getImage = function (id, options) {
		return httpCall('GET', 'https://api.imageshack.com/v2/images/' + id, options, true)
	}

	/**
	 * Get multiple images
	 * ids: string with ids, csv
	 * options: an options object containing any or all:
	 *      - next_prev_limit: Sets the limit of next and previous images returned. Default is 2
	 *      - related_images_limit: Sets the limit of related images to be returned. Default is 10
	 */
	this.getMultipleImages = function(ids, options){
		var params = options || {};
		params.ids = ids;
		return httpCall('GET', 'https://api.imageshack.com/v2/images', params, true)
	}

	/**
	 * Update image
	 * id: image id
	 * options:
	 *     - title: Set a title for the image
	 *     - description: Set a description for the image
	 *     - tags: List of tags to attach to the image. Array or csv
	 *     - original_filename: Rename the original_filename.
	 *     - public: Sets public setting. Default is true.
	 *     - filter: User specified image filter 0-23. 0 is no filter.
	 *     - comments_disabled: Disable comments for the specific image
	 */
	this.updateImage = function(id, options){
		return httpCall('PUT', 'https://api.imageshack.com/v2/images/' + id, options, true)
	}

	/**
	 * Update multiple images
	 * ids: string with image ids, csv
	 * options:
	 *     - title: Set a title for the image
	 *     - description: Set a description for the image
	 *     - tags: List of tags to attach to the image. Array or csv
	 *     - public: Sets public setting. Default is true.
	 *     - filter: User specified image filter 0-23. 0 is no filter.
	 *     - comments_disabled: Disable comments for the specific image
	 */
	this.updateMultipleImages = function(ids, options){
		var params = options || {};
		params.ids = ids;
		return httpCall('PUT', 'https://api.imageshack.com/v2/images', params, true)
	}

	/**
	 * Delete image
	 * id: image id of image to delete
	 */
	this.deleteImage = function(id){
		return httpCall('DELETE', 'https://api.imageshack.com/v2/images/' + id, true)
	}

	/**
	 * Delete multiple images
	 * ids: string with ids of images to delete, csv
	 */
	this.deleteMultipleImages = function(ids){
		return httpCall('DELETE', 'https://api.imageshack.com/v2/images', {ids: ids}, true)
	}


	/**
	 * Get user images
	 * username: get images from this user
	 * options:
	 *     - hide_empty: Exclude empty albums from album count
	 *     - show_private: Includes private images in counts
	 *     - show_hidden: Includes hidden(deleted) images in counts
	 *     - limit: amount of images fetched
	 *     - offset: where in set to start fetching images
	 */
	this.getUserImages = function (username, options) {
		return httpCall('get', 'https://api.imageshack.com/v2/user/' + username + '/images', options, true)
	}


	this.getUserSettings = function (username, params) {
		return httpCall('get', 'https://api.imageshack.com/v2/user/settings', params, true);
	}


}

