module.exports = function(grunt) {
   'use strict';
   grunt.initConfig({

      copy: {
         js: {
            files: [{
               expand: true, 
               cwd: 'js/', 
               src: ['main.js'], 
               dest: '/var/www/html/js/', 
             }]
         },
         css: {
            files: [{
               expand: true, 
               cwd: 'css/', 
               src: ['main.css'], 
               dest: '/var/www/html/css/', 
             }]
         },
         html: {
            files: [{
               expand: true, 
               cwd: '.', 
               src: ['home.html', 'about.html', 'index.html'], 
               dest: '/var/www/html/', 
             }]
         },
         php: {
            files: [{
               expand: true, 
               cwd: 'php/', 
               src: ['phpScript.php'], 
               dest: '/var/www/html/php/', 
             }]
         }
      }, // copy

      connect: {
         server: {
            options: {
               hostname: '127.0.0.2',
               port: 3000,
               livereload: true
            }
         }
      }, // connect

      watch: {
         options: {
            spawn: false,
            livereload: true
         },
         scripts: {
            files: ['**/*.js', '**/*.css', '*.html', '**/*.php'],
            tasks: ['copy']
         }
      } // watch

   }); // initConfig

   grunt.loadNpmTasks('grunt-contrib-copy');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-contrib-connect'); // problem with connect-server, due to it doen't run PHP

   grunt.registerTask('default', ['copy', 'watch']);

}; // wrapper function
