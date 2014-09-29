Package.describe({
	summary: " Imageshack api ",
	version: "1.0.0",
	git: " \* Fill me in! *\ "
});

Package.onUse(function (api) {
	api.versionsFrom('METEOR@0.9.2.2');
	api.addFiles('imageshack.js');
	api.use('http');
	api.export('Imageshack', 'server');
});

Package.onTest(function (api) {
	api.use('tinytest');
	api.use('andrelillvede:imageshack');
	api.addFiles('imageshack-tests.js');
});

Npm.depends({
	'form-data': '0.1.4'
})