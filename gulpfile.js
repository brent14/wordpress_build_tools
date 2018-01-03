'use strict';

const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const livereload = require('gulp-livereload');
const autoprefixer = require('gulp-autoprefixer');
const nano = require('gulp-cssnano');
const debug = require('gulp-debug');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const csscomb = require('gulp-csscomb');
const prettify = require('gulp-jsbeautifier');
const jshint = require('gulp-jshint');
const stylish = require('jshint-stylish');
const chalk = require('chalk');
const jscs = require('gulp-jscs');
const gutil = require('gulp-util');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const watchify = require('watchify');
const assign = require('lodash.assign');
const changed = require('gulp-changed');
const del = require('del');
const imagemin = require('gulp-imagemin');
const environments = require('gulp-environments');
const fs = require('fs');
const es2015 = require('babel-preset-es2015');
const pump = require('pump');
const stripCssComments = require('gulp-strip-css-comments');
const gulpSequence = require('gulp-sequence');
const exit = require('gulp-exit');
const ftp = require( 'vinyl-ftp' );
const sftp = require('gulp-sftp');
const gitmodified = require('gulp-gitmodified');
const wpRev = require('gulp-wp-rev');
 


// ----------------------------------------
// project structure
// ----------------------------------------

const project_name = 'PROJECT_NAME';
const project = {};
project.plugin = {};
project.theme = {};



// ---------------------------------------- plugin

project.theme.dir = '../wp-content/themes/';
project.theme.name = project_name;

project.dir = project.theme.dir + project.theme.name;

// Html dir
project.theme.html_src = 	project.dir;

// Css
project.theme.css_src = 	project.dir + '/src/css';
project.theme.css_dist = 	project.dir + '/dist/css/';

// Sass
project.theme.sass_src = 	project.dir + '/src/sass/';

// Js
project.theme.js_src = 		project.dir + '/src/js/';
project.theme.js_dist = 	project.dir + '/dist/js/';

// Img
project.theme.img_src = 	project.dir + '/src/img/';
project.theme.img_dist = 	project.dir + '/dist/img/';

// fonts
project.theme.font_src = 	project.dir + '/src/font/';
project.theme.font_dist = 	project.dir + '/dist/font/';

// src +
project.theme.dist = 		project.dir + '/dist/';
project.theme.src = 		project.dir + '/';


// ---------------------------------------- plugin

project.plugin_name 		= 'plugin_name'
project.plugin.dir 			= '/wp-content/plugins/' + project.plugin_name;

// js
project.plugin.js_src 		= project.plugin.dir  + '/src/js/';
project.plugin.js_dist 		= project.plugin.dir  + '/dist/js/';

// Sass
project.plugin.sass_src	 	= project.plugin.dir  + '/src/sass/';

// Css
project.plugin.css_src 		= project.plugin.dir  + '/src/css/';
project.plugin.css_dist 	= project.plugin.dir  + '/dist/css/';

// Image
project.plugin.img_src 		= project.plugin.dir  + '/src/img/';
project.plugin.img_dist 	= project.plugin.dir  + '/dist/img/';

// ----------------------------------------
// environment setup
// ----------------------------------------
// - defaults to development


var development = environments.development;
var production = environments.production;
environments.current(development);

gulp.task('env_prod', () => {
	environments.current(production);
});

gulp.task('env_dev', () => {
	environments.current(development);
});


// ----------------------------------------
// clean
// ----------------------------------------
// - clean js and sass in dist 


gulp.task('remove_prod_js_sass', () => {
	del.sync([project.theme.js_dist, project.theme.css_dist, project.theme.img_dist], {
		force: true
	});
});

gulp.task('remove_images', () => {
	del.sync([project.theme.img_dist], {
		force: true
	});
});


// ----------------------------------------
// copy
// ----------------------------------------
// - copy src js and css files for dist
// 

gulp.task('copy_js_css', () => {
  return gulp.src([project.theme.js_src + '/*.js', project.theme.css_src + '/style.css'], { base : project.theme.src + 'src/' })
    .pipe(gulp.dest(project.theme.dist));
});



// ----------------------------------------
// images
// ----------------------------------------
// - lossless compression of images

gulp.task('images', () =>
	gulp.src(project.theme.img_src + '**/*')
	.pipe(imagemin())
	.pipe(gulp.dest(project.theme.img_dist))
);


// ----------------------------------------
// fonts
// ----------------------------------------
// - lossless compression of images

gulp.task('fonts', () =>
	gulp.src(project.theme.font_src + '**/*')
	.pipe(gulp.dest(project.theme.font_dist))
);


// ----------------------------------------
// sass
// ----------------------------------------
// - adds susy and breakpoint to sass
// - auto prefixes for cross browser

gulp.task('sass', () => {
	return gulp.src(project.theme.sass_src + '/**/*.scss')

		.pipe(sass.sync({
			includePaths: ['node_modules/breakpoint-sass/stylesheets/',
                         'node_modules/susy/sass/', ],
			outputStyle: 'Compact', // Compact, nested, expanded, compressed
			indentType: 'tab',
			indentWidth: '1',
		}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(gulp.dest(project.theme.css_src))
		.pipe(debug({
			title: 'updating sass files:',
		}))
		.pipe(gulp.dest(project.theme.css_dist))
		.pipe(livereload())
});


// ----------------------------------------
// js
// ----------------------------------------
// - builds javascript pipeline
// - uses babelify es2015



var customOpts = {
	entries: project.theme.js_src + 'app.js',
	debug: true,
	cache: {},
	packageCache: {},
	transform: [['babelify', {
		presets: [es2015]
	}]],
	ignore: [ project.theme.js_src + '/node_modules/**']
};

var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts))

gulp.task('js', bundle_js); // so you can run `gulp js` to build the file
b.on('update', bundle_js); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal


function bundle_js(bundler) {
	return b.bundle()
		.on('error', map_error)
		.pipe(source('app.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
	    .pipe(sourcemaps.write('../js/maps')) // writes .map file
	    .pipe(gulp.dest(project.theme.js_dist))
	    .pipe(livereload());
}


// ----------------------------------------
// js_minify
// ----------------------------------------
// - minifies js
// - create a sourcemap

// i dont need sourcemap, its one in the step above
// i still need the minfiy step for production

gulp.task('js_minify', function (cb) {
	pump([
        gulp.src(project.theme.js_dist + 'app.js'),
        uglify(),
        rename({
				suffix: '.min'
			}),
        sourcemaps.init({
				loadMaps: true
			}),
        sourcemaps.write('../js/maps'),
        gulp.dest(project.theme.js_dist)
    ],
		cb
	);
});




// ----------------------------------------
// mocha
// ----------------------------------------
// - test runner
// - need to set this up with every module


gulp.task('mocha', function () {
	return gulp
		.src('./test/*.js', {
			read: false
		})
		.pipe(mocha({
			reporter: 'list'
		}))
		.on('error', map_error);
});


gulp.task('lint', () => {

	return gulp.src([project.theme.js_src + '**/**/*.js', '!node_modules/**'])
		.pipe(eslint())
		// Alternatively use eslint.formatEach() (see Docs).
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});


// ----------------------------------------
// jscs_report
// ----------------------------------------
// - jshint your javascript files
// - list of preset https://github.com/jscs-dev/node-jscs/tree/master/presets
// - only reporting

gulp.task('jscs_report', () => {
	return gulp.src(project.theme.js_src + '**/**/*.js')
		.pipe(jscs())
		.on('error', map_error)
		.pipe(jscs.reporter());
});

// ----------------------------------------
// jscs_report_fix
// ----------------------------------------
// - jshint your javascript files
// - only reporting and fix

gulp.task('jscs_report_fix', () => {
	return gulp.src(project.theme.js_src + '**/**/*.js')
		.pipe(jscs({
			fix: true
		}))
		.pipe(jscs.reporter())
		.pipe(jscs.reporter('fail'))
		.on('error', map_error)
		.pipe(gulp.dest(project.theme.js_src));
});

// ----------------------------------------
// js_hint
// ----------------------------------------
// - jshint your javascript files

gulp.task('js_hint', () => {
	gulp.src(project.theme.js_src + '**/main.js')
		.pipe(debug({
			title: 'jshint:',
		}))
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.on('error', map_error);
	//.pipe(livereload());
});


// ----------------------------------------
// css_nano
// ----------------------------------------
// - compress all css files

gulp.task('css_nano', () => {
	return gulp.src(project.theme.css_dist + 'style.css')
		.pipe(stripCssComments({
			preserve: false
		}))
		.pipe(sourcemaps.init())
		.pipe(nano())
		.pipe(debug({
			title: 'non-minfied css',
		}))
		.pipe(rename({
			suffix: '.min',
		}))
		.pipe(debug({
			title: 'minify css',
		}))

		// .pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(project.theme.css_dist))
		.on('error', map_error);
});


// ----------------------------------------
// comb_sass
// ----------------------------------------
// - organizes css properties in sass files
//   for readability

gulp.task('comb_sass', () => {
	return gulp.src(project.theme.sass_src + '/**/*.scss')
		.pipe(csscomb('zen.json'))
		.pipe(debug({
			title: 'updating sass files:',
		}))
		.pipe(gulp.dest(project.theme.sass_src));
});


// ----------------------------------------
// clean_js
// ----------------------------------------
//  - clean up javascript

gulp.task('clean_js', () => {
	gulp.src(project.theme.js_src + '**/**/*.js')
		.pipe(prettify({
			config: '.jsbeautifyrc',
			mode: 'VERIFY_AND_WRITE',
		}))
		.pipe(gulp.dest(project.theme.js_src))
		.on('error', map_error);
});


// ----------------------------------------
// clean_html
// ----------------------------------------
//      - clean up html
//      - just point src at html files that you want to clean up

gulp.task('clean_html', () => {
	gulp.src([project.theme.html_src + '**/**/*.html'])
		.pipe(prettify({
			config: '.jsbeautifyrc',
			mode: 'VERIFY_AND_WRITE',
		}))
		.pipe(prettify.reporter())
		.pipe(gulp.dest(project.theme.html_src))
		.on('error', map_error)
});


// ----------------------------------------
// clean_gulp
// ----------------------------------------
// - clean up file formating for gulp file

gulp.task('clean_gulp', () => {
	gulp.src(['gulpfile.js'])
		.pipe(prettify({
			config: '.jsbeautifyrc',
			mode: 'VERIFY_AND_WRITE',
		}))
		.pipe(gulp.dest('./'))
		.on('error', map_error);
});


// ----------------------------------------
// cache bust js + css
// ----------------------------------------
// - add a new hash for the version control in functions.php


gulp.task('cache_bust', function() {
	gulp.src(project.dir + '/functions.php')
	.pipe(wpRev({
		css: project.theme.css_dist + 'style.min.css',
		cssHandle: 'boyne-style-prod',
		js: project.theme.js_dist + 'app.min.js',
		jsHandle: 'boyne-app-prod'
	}))
	.pipe(gulp.dest(project.dir));
});


// ----------------------------------------
// map_error
// ----------------------------------------
// - output errors nicely to console

function map_error(err) {
	if (err.fileName) {
		// Regular error
		gutil.log(chalk.red(err.name) +
			': ' +
			chalk.yellow(err.fileName.replace(__dirname + '/src/', '')) +
			': ' +
			'Line ' +
			chalk.magenta(err.lineNumber) +
			' & ' +
			'Column ' +
			chalk.magenta(err.columnNumber || err.column) +
			': ' +
			chalk.blue(err.description))
	} else {
		// Browserify error..
		gutil.log(chalk.red(err.name) +
			': ' +
			chalk.yellow(err.message))
	}

	this.emit('end');
}


// ----------------------------------------
// watch
// ----------------------------------------
// - setup in browser live reload (css & html)
// - build main from sass in real time

gulp.task('watch', () => {

	livereload.listen({
		// key: fs.readFileSync('.key'),
		// cert: fs.readFileSync('.crt'),
	});

	// Compile sass on changes
	gulp.watch(project.theme.sass_src + '/**/*.scss', ['sass']);

	// Live reload in browser
	gulp.watch([project.html_src + '**/**/*.html', project.html_src + '**/**/*.php', project.plugin.src + '**/**/*.php'], livereload.changed);

	// add new images to dist
	gulp.watch(project.theme.img_src + '**', ['images']);

	// js build
	gulp.watch(project.js_src + '**/**/*.js', ['js_build']);
});


// ----------------------------------------
// tasks
// ----------------------------------------


// clean + copy images
gulp.task('clean_imgs', ['remove_images']);
gulp.task('copy_src_imgs', ['images', 'clean_imgs']);


// production scripts

// dev
gulp.task('default', ['env_dev', 'js', 'watch']);


// varios js building tasks
gulp.task('js_build', ['js', 'js_hint']);
gulp.task('js_hint_jscs', ['js', 'js_hint', 'jscs_report']);
gulp.task('js_hint_jscs_fix', ['js', 'jscs_report_fix']);


gulp.task('prod', gulpSequence('env_prod', 'remove_prod_js_sass', 'copy_js_css', 'js_minify', 'css_nano', 'cache_bust'))








// ----------------------------------------
// the end
// ----------------------------------------