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
        if (ip) {
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


        //////////////////////////////////////////////////////////////////
        // CONSTANT CONTACT: included here to avoid loading jquery twice
        //////////////////////////////////////////////////////////////////
        // CONSTANT CONTACT: normally this appears BELOW the script tag, but since we have two on a page
        // I'm only embedding once here at the top.
        // We have created a custom (simpler) version of their script since it's doing some stupid stuff:
        // submitting twice, and manipulating data oddly on success.
        // Original: https://static.ctctcdn.com/h/contacts-embedded-signup-assets/1.0.2/js/signup-form.js

        // Constant Contact Pseudo Select: Transfer Values from Custom Drop Downs to Hidden Fields
        $.each($('.popup select.registerCustom'), function (i, el) {
            $(el).on('change', function (event) {
                var custom = $(event.target);
                var inputValue = custom.val();
                var target = $('#' + custom.attr('id') + '_value ');
                target.val(inputValue);
            });
        });

        var errClass = 'is-error';
        var msgErrClass = 'ctct-form-errorMessage';

        var localizedErrMap = {};
        localizedErrMap['required'] = 'This field is required.';
        localizedErrMap['ca'] = 'An unexpected error occurred while attempting to send email.';
        localizedErrMap['generic'] = 'This field is invalid.';
        localizedErrMap['shared'] = 'Sorry, we could not complete your sign-up. Please contact us to resolve this.';
        localizedErrMap['unsubscribed'] = 'Sorry, you were previously unsubscribed from our lists. Please contact us to subscribe again.';

        var postURL = 'https://visitor2.constantcontact.com/api/signup';

        function main($) {
            $.support.cors = true;

            var _form = $('[data-id="embedded_signup:form"]');

            _form.submit(function (e) {
                e.preventDefault();

                /*  Generate the serialized payload and hash to map with */
                var payload = $(this).serialize();
                var payload_check = payload.split('&');
                var payload_check_hash = {};
                /* Populate the hash with values */
                var i, j;
                /* Handle the option to redirect */
                for (i = 0; i < payload_check.length; i++) {
                    var p = payload_check[i].split('=');
                    if (p[0].lastIndexOf('list_', 0) === 0) {
                        p[0] = 'list';
                    }
                    payload_check_hash[p[0]] = p[1];
                }
                /* Clear any errors that may of been set before */
                _form.find('.' + msgErrClass).remove();
                _form.find('.' + errClass).removeClass(errClass);
                _form.find('.ctct-flagged').removeClass('ctct-flagged');

                /* This is the ONLY client side validation */

                /* Clean custom fields if needed */
                var payload_clean = payload.split('&');
                var id, item;
                var custom_data_to_clean = {};
                for (i = 0; i < payload_clean.length; i++) {
                    item = payload_clean[i].split('=');
                    /* See if we have a empty value */
                    if (!item[1] || item[1] === "") {
                        /* Check the field name to see if its custom */
                        if (item[0].match(/cf_text_value--[\w0-9\-\:\_]*/)) {
                            id = item[0].split('--')[1];
                            custom_data_to_clean[id] = true;
                        } else if (item[0].match(/cf_date_value_day--[\w0-9\-\:\_]*/)) {
                            id = item[0].split('--')[1];
                            if (!custom_data_to_clean[id]) {
                                custom_data_to_clean[id] = {};
                            }
                            custom_data_to_clean[id]['day'] = true;
                        } else if (item[0].match(/cf_date_value_month--[\w0-9\-\:\_]*/)) {
                            id = item[0].split('--')[1];
                            if (!custom_data_to_clean[id]) {
                                custom_data_to_clean[id] = {};
                            }
                            custom_data_to_clean[id]['month'] = true;
                        } else if (item[0].match(/cf_date_value_year--[\w0-9\-\:\_]*/)) {
                            id = item[0].split('--')[1];
                            if (!custom_data_to_clean[id]) {
                                custom_data_to_clean[id] = {};
                            }
                            custom_data_to_clean[id]['year'] = true;
                        } else {
                            delete payload_clean[i];
                        }
                    }
                }

                payload_clean = payload_clean.filter(function (n) {
                    return n !== undefined;
                });
                /* Iterate over the flagged ids and scrub the data */
                for (i in custom_data_to_clean) {
                    /* Loop over the payload and remove the fields that match out scrub needs */
                    for (j = 0; j < payload_clean.length; j++) {
                        item = payload_clean[j];
                        if (item) {
                            item = item.split('=');
                            /* Match based of field id */
                            if (item[0].match(new RegExp('.*--' + i, 'i'))) {
                                /* If the value is a bool then we are dealing with text */
                                if (custom_data_to_clean[i] === true) {
                                    delete payload_clean[j];
                                    /* If the value is an object its a date and we should only scrub if all fields are empty */
                                } else if (typeof custom_data_to_clean[i] === 'object') {
                                    if (custom_data_to_clean[i]['day'] === true && custom_data_to_clean[i]['month'] === true && custom_data_to_clean[i]['year'] === true) {
                                        delete payload_clean[j];
                                    }
                                }
                            }
                        }
                    }
                }

                /* Search for a redirect URL in the payload, and extract the URL. */
                payload_clean = payload_clean.filter(function (n) {
                    return n !== undefined;
                }).join('&');

                $.ajax({
                    type: 'POST',
                    crossDomain: true,
                    url: postURL,
                    data: payload_clean,
                    error: function (xhr, status, err) {
                        json = xhr.responseJSON;
                        if (json) {
                            if (json.offenders) {
                                for (var i in json.offenders) {
                                    var item = json.offenders[i];
                                    var offender = item.offender;
                                    var required = item.required;
                                    var inputUI = _form.find('[name=' + offender + ']');
                                    var labelUI = null;
                                    var p = inputUI.parent('p');
                                    if (p.length === 0) {
                                        labelUI = _form.find('[data-name=' + offender + ']');
                                        /* if the offender s unsubscribed, have the error message above the email. */
                                        if (offender === 'unsubscribed') {
                                            labelUI = _form.find('[data-name=email]');
                                        }
                                        if (labelUI.length === 0) {
                                            continue;
                                        }
                                    } else {
                                        labelUI = p.find('label');
                                    }

                                    if (required === true && !offender.match(/list.*/)) {
                                        if (!labelUI.hasClass('ctct-flagged')) {
                                            labelUI.after(errorSection('required'));
                                        }
                                    } else if (offender === 'ca') {
                                        if (!labelUI.hasClass('ctct-flagged')) {
                                            labelUI.after(errorSection('ca'));
                                        }
                                    } else if (offender === 'email' || offender === 'unsubscribed') {
                                        if (!labelUI.hasClass('ctct-flagged')) {
                                            if (offender === 'email') {
                                                labelUI.after(errorSection('email'));
                                            } else {
                                                labelUI.after(errorSection('unsubscribed'));
                                            }
                                        }
                                    } else if (offender.match(/list.*/)) {
                                        if (!labelUI.hasClass('ctct-flagged')) {
                                            labelUI.after(errorSection('list'));
                                        }
                                    } else {
                                        if (!labelUI.hasClass('ctct-flagged')) {
                                            labelUI.after(errorSection('generic'));
                                        }
                                    }
                                    inputUI.addClass(errClass);
                                    labelUI.addClass('ctct-flagged');
                                }
                            } else {
                                _form.prepend(errorSection('shared'));
                            }
                        } else {
                            _form.prepend(errorSection('shared'));
                        }
                    },
                    success: function (data, status, xhr) {

                        $('.ctct-embed-signup button').hide();
                        $('.ctct-embed-signup form').hide();
                        $.each($('.ctct-embed-signup .success_message'), function (i, el) {
                            $(el).removeClass('hide');
                        });
                    }
                });
                return false;
            });
        }

        function errorSection(errorType) {
            return '<div class="' + msgErrClass + '">' + localizedErrMap[errorType] + '</div>';
        }

        main($);


    });
}));