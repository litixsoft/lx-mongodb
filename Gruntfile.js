module.exports = function (grunt) {
    'use strict';

    var filesToCover = 'lib/**/*.js';

    // Project configuration.
    //noinspection JSUnresolvedFunction,JSUnresolvedVariable
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
            ' * <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
            ' *\n' +
            ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
            ' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n' +
            ' */\n\n',
        // Before generating any new files, remove any previously-created files.
        clean: {
            build: ['build']
        },
        jshint: {
            files: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
            junit: 'build/reports/jshint.xml',
            checkstyle: 'build/reports/jshint_checkstyle.xml',
            options: {
                bitwise: true,
                curly: true,
                eqeqeq: true,
                forin: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                noempty: true,
                nonew: true,
                regexp: true,
                undef: true,
                unused: true,
                strict: true,
                indent: 4,
                quotmark: 'single',
                es5: true,
                loopfunc: true,
                browser: true,
                node: true
            }
        },
        watch: {
            files: '<%= jshint.files %>',
            tasks: ['jshint:files']
        },
        // istanbul
        instrument: {
            files: filesToCover,
            options: {
                basePath: 'build/instrument/'
            }
        },
        reloadTasks: {
            rootPath: 'build/instrument/lib'
        },
        storeCoverage: {
            options: {
                dir: 'build/reports/code_coverage'
            }
        },
        makeReport: {
            src: 'build/reports/code_coverage/**/*.json',
            options: {
                type: 'cobertura',
                dir: 'build/reports/code_coverage',
                print: 'detail'
            }
        },
        jasmine_node: {
            specNameMatcher: './*.spec', // load only specs containing specNameMatcher
            projectRoot: 'test',
            requirejs: false,
            forceExit: true,
            jUnit: {
                report: true,
                savePath: 'build/reports/jasmine/',
                useDotNotation: true,
                consolidate: true
            }
        }
    });

    // Load tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-istanbul');

    // Test task.
    grunt.registerTask('test', ['clean', 'jshint:files', 'jasmine_node']);

    // Default task.
    grunt.registerTask('default', ['test']);

    // CI task.
    grunt.registerTask('cover', ['clean', 'jshint:files', 'instrument', 'reloadTasks', 'jasmine_node', 'storeCoverage', 'makeReport']);
};