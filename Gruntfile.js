module.exports = function(grunt) {
	
  var pkg = grunt.file.readJSON('package.json'),
	  distdir = 'dist/' + pkg.name + '-' + pkg.version + '/';
	 
  // Project configuration.
  grunt.initConfig({
	pkg: pkg,
	
    // Before generating any new files, remove any previously-created files.
    clean: {
      test: [distdir]
    },

	// Copy things to a distdir dir, and only change things in the temp dir
	copy: {
		prod: {
			files: [
				{expand: true, cwd: 'src/', src : ['chrome.manifest' ],  dest: distdir },
				{expand: true, cwd: 'src/', src : ['**/*.css','**/*.js','**/*.jsm', '**/*.xul', '**/*.png','**/*.jpg'],  dest: distdir },
				{expand: true, cwd: 'src/', src : ['**/*.dtd', '!**/*_amo_*.dtd', '**/*.properties'],  dest: distdir },
			]
		},
	},
	
	"string-replace": {
	  install_rdf: {
		src: 'src/install.rdf',
		dest: distdir + 'install.rdf',
		options: {
		  replacements: [
		  {
			pattern: /\<em\:version\>.+\<\/em\:version\>/g,
			replacement: "<em:version>" + pkg.version + "</em:version>"
		  },
		  {
			pattern: /\<em\:creator\>.+\<\/em\:creator\>/g,
			replacement: "<em:creator>" + pkg.author.name + "</em:creator>"
		  },
		  {
			pattern: /\<em\:homepageURL\>.*\<\/em\:homepageURL\>/g,
			replacement: "<em:homepageURL>" + pkg.homepage + "</em:homepageURL>"
		  },		  
		  {
			pattern: /\<em\:description\>.*\<\/em\:description\>/g,
			replacement: "<em:description>" + pkg.description + "</em:description>"
		  }
		  ]
		}
	  },
	  
	  content_files : {
		options: {
			replacements: [
				{
					pattern: /__version__/g,
					replacement: pkg.version
			}]
		},
		
		files: [
				{expand: true, cwd: distdir, src : ['install.rdf','chrome.manifest'],  dest: distdir },
				{expand: true, cwd: distdir, src : ['**/*.css','**/*.js','**/*.jsm', '**/*.xul'],  dest: distdir },
				{expand: true, cwd: distdir, src : ['**/*.dtd'],  dest: distdir },
			]

		
	  },
	  
	  content_files : {
		options: {
			replacements: [{
				pattern: /(\s)+\/\/[^!].+/g,	// remove comments
				replacement: ''
			},
			{
				pattern: /(\s)+stopTube\.debug\(.+\)\;/g,
				replacement: ''
			}]
		},
		
		files: [
				{expand: true, cwd: distdir, src : ['**/*.js','**/*.jsm'],  dest: distdir },
			]
	  }	  
	},
	
	compress: { 
		prod: { 
			options: {
			  archive: 'dist/<%=pkg.name%>-<%=pkg.version%>.xpi',
			  mode: 'zip'
			},
			files: [ { expand: true, cwd: distdir, src: '**/**' }]
		} 
	},
	
	fileregexrename: {
	  rename_version: {
		options: {
		  replacements: [
		    {
			  pattern: /__version__/g,
			  replacement: pkg.version
		    }
		  ]
		},
		files: [ { expand: true, cwd: distdir, src: '__version__', dest: distdir }]

	  },
	  
	}
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.loadNpmTasks('grunt-string-replace');  
  grunt.loadNpmTasks('grunt-file-regex-rename');

  grunt.loadNpmTasks('grunt-contrib-compress');

  // $: grunt bump
  grunt.loadNpmTasks('grunt-bump');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'copy:prod', 'string-replace', 'fileregexrename', 'compress']);
  
};