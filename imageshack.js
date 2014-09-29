Imageshack = function(username, password, api_key) {
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



	function post(url, params){
		var form = new FormData();

		form.append('api_key',  api_key);
		form.append('auth_token', auth_token);

		if(Array.isArray(params)){
			params.forEach(function(param){
				form.append(param.name, param.value, param.options)
			})
		}else if(params){
			form.append(params.name, params.value, params.options)
		}


		var fut = new Future();

		form.submit(url, function(err, res) {
			console.log('STATUS: ' + res.statusCode);
			console.log('HEADERS: ' + JSON.stringify(res.headers));

			var body = "";

			if (err) {
				fut.throw(err);
				return
			}

			res.on('data', function (chunk) {
				body += chunk;
			});

			res.on('end', function(){
				try{
					fut.return(JSON.parse(body))
				}catch(e){
					fut.throw(e);
				}
			})

		});

		return fut.wait();
	}

	function get(url, params, authenticate){

		if(!authenticate && typeof params == 'boolean'){
			authenticate = params;
			params = {};
		}

		params = params || {};

		if(authenticate){
			params.auth_token = auth_token;
		}

		return HTTP.get(url, {params: params})
	}

	/*
	- file(s[])@: Image binary(s). May send multiple images. Use ‘files[]’ array param when sending multiple images.
	- album: Album title or album id to attach files to. If album exists files will be added. If not a new album will be created.
	- title(s[]): Set a title for the image. Use ‘titles[]’ array param or ‘titles’ param separated by commas for multiple image titles.
	- description(s[]): Set a description for the image. Use descriptions[]’ array param or descriptions param separated by commas for multiple image descriptions.
	- tags: List of tags to attach to the image. Array or csv
	- public: Sets public setting. Default is true.
	- filter: User specified image filter 0-23. 0 is no filter. Will be applied images transloaded.
	- comments_disabled: Disable comments for the specific image
	*/
	this.upload = function(buffer, params){
		return post('https://api.imageshack.com/v2/images', {
			name: 'file@',
			value: buffer,
			options: {filename: '1.jpeg', contentType: 'application/octet-stream'}
		});
	}

	/*

	Params:
	 hide_empty: Exclude empty albums from album count
	 show_private: Includes private images in counts
	 show_hidden: Includes hidden(deleted) images in counts

	*/

	this.getUserSettings = function(username, params){
		return get('https://api.imageshack.com/v2/user/settings', params, true);
	}

}

