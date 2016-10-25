// Use Require.js or Contextual Scope
(function (root, factory) {
    if (typeof require === 'function') {
        require(['stratus', 'jquery', 'underscore', 'https://www.youtube.com/player_api'], factory);
    } else {
        factory(root.Stratus, root.$, root._);
    }
}(this, function (Stratus, $, _) {

    Stratus.DOM.ready(function () {

        function trackEvent(el) {
            var trackCategory = el.dataAttr('trackCategory') || 'unknown';
            var trackLabel = el.dataAttr('trackLabel') || null;
            var trackValue = el.dataAttr('trackValue') || null;
            ga('send', 'event', trackCategory, trackLabel, trackValue);
        }

        // Track Version of Page
        if ($('body').dataAttr('contentVersion')) {
            ga('send', 'event', 'content', 'version', $('body').dataAttr('contentVersion'));
        }

        // Track all registered elements
        $.each($('[data-trackCategory]'), function (i, el) {
            $(el).click(function (event) {
                trackEvent($(event.target));
            });
        });

        // Track YouTube Actions
        if($('#launchVideo').length) {
            var player = new YT.Player('launchVideo', {
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
            var pauseFlag = false;

            function onPlayerReady(event) {
                // do nothing, no tracking needed
            }

            function onPlayerStateChange(event) {
                var state = player.getPlayerState();
                var playerTime = parseInt(player.getCurrentTime()/10)*10;
                // Track Play
                if (state == 1) {
                    ga('send', 'event', 'videos', 'play', 'promo');
                    pauseFlag = true;
                }
                // Track Pause
                if (state == 2 && pauseFlag) {
                    ga('send', 'event', 'videos', 'pause', 'promo');
                    ga('send', 'event', 'videos', 'pauseTime', playerTime);
                    pauseFlag = false;
                }
                // Track Finish
                if (state == 0) {
                    ga('send', 'event', 'Videos', 'finished', 'promo');
                }
            }

            // Track Bounce
            Stratus.DOM.unload(function () {
                var playerTime = parseInt(player.getCurrentTime()/10)*10;
                ga('send', 'event', 'videos', 'bounceTime', playerTime);
            });
        }



        // Get IP and Zip
        var ip = $('.registerZip').first().data('ip');
        if (ip.length > 0) {
            $.getJSON('https://ipapi.co/' + ip + '/json', function (data) {
                if (!data) return false;
                if (data.postal) {
                    $.each($('.registerZip'), function (i, el) {
                        $(el).val(data.postal);
                        $(el).parent().hide();
                    });
                } else {
                    $.each($('.registerZip'), function (i, el) {
                        $(el).set('value', '0');
                    });
                }
            });
        }


        /**
         * MailChimp Submission
         */
        var formClass = 'mailChimpSignup';

        // Support Multiple Forms inside an element of this class name
        var forms = $('.'+formClass+' form');
        if ( forms.length > 0 ) {
            $.each(forms, function(i, el) {
                $(el).submit(function (event) {
                    if (event) event.preventDefault();
                    // validate_input() is a validation function I wrote, you'll have to substitute this with your own.
                    if (validate_input($(el))) {
                        register($(el));
                    }
                });
            });
        }

        function register($form) {
            $.ajax({
                type: 'get',
                url: '//launchapp.us14.list-manage.com/subscribe/post-json?u='+$form.data('user')+'&id='+$form.data('id')+'&c=?',
                data: $form.serialize(),
                cache: false,
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                error: function(err) {
                    $form.prepend('<div class="form-error">Oops, there was a problem connecting ;( <br>Email us at <a href="mailto:help@launchapp.io">help@launchapp.io</a> and we will add you manually.</div>');
                    ga('send', 'event', 'error', 'form', $form.find('input[name="EMAIL"]').val());
                },
                success: function(data) {
                    if (data.result != "success") {
                        $form.prepend('<div class="form-error">Oops, there was a problem ;( <br>'+data.msg+'<br>Email us at <a href="mailto:help@launchapp.io">help@launchapp.io</a> for more help.</div>');
                        ga('send', 'event', 'error', 'form', $form.find('input[name="EMAIL"]').val());
                    } else {
                        $form.hide();
                        $.each($form.parent().find('.success_message'), function (i, el) {
                            $(el).removeClass('hide');
                        });
                    }
                }
            });
        }

        function validate_email(email) {
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }

        function validate_input($form) {
            var inputs = $form.find('.form-control');
            // remove all errors
            var errors = $form.find('.form-error');
            errors.remove();
            var results = true;
            $.each(inputs, function(i, el) {
                $(el).removeClass('is-error');
                if($(el).hasClass('required')) {
                    var elError = null;
                    if(!$(el).val()) {
                        elError = 'Please provide a valid value.';
                    }
                    if($(el).attr('name')=='EMAIL') {
                        var emailValid = validate_email($(el).val());
                        if(!emailValid) {
                            elError = 'Please provide a valid email address.';
                        }
                    }
                    if(elError) {
                        results = false;
                        $(el).addClass('is-error');
                        $(el).before('<div class="form-error">'+elError+'</div>');
                    }
                }
            });
            return results;
        }



    });
}));