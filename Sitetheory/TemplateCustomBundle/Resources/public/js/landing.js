// Use Require.js or Contextual Scope
(function (root, factory) {
    if (typeof require === 'function') {
        require(['stratus', 'jquery', 'underscore'], factory);
    } else {
        factory(root.Stratus, root.$, root._);
    }
}(this, function (Stratus, $, _) {
    Stratus.DOM.ready(function () {

        function trackEvent(el) {
            var trackCategory = el.dataAttr('trackCategory') || 'CTA';
            var trackLabel = el.dataAttr('trackLabel') || null;
            var trackValue = el.dataAttr('trackValue') || null;
            ga('send', 'event', trackCategory, trackLabel, trackValue);
        }

        // Track video watches

        // Track all registered elements
        $.each($('[data-trackCategory]'), function(i, el) {
            $(el).click(function(event) {
                trackEvent($(event.target));
            });
        });


        // Get IP and Zip
        var ip = $('#registerZip').data('ip');
        if(ip) {
            $.getJSON('https://ipapi.co/' + ip + '/json', function (data) {
                if(!data) return false;
                if (data.postal) {
                    $('#registerZip').val(data.postal);
                    $('#registerZip').parent().hide();
                } else {
                    $('#registerZip').set('value', '0');
                }
            });
        }

        // Constant Contact Forms: Transfer Values from Custom Drop Downs to Hidden Fields
        $.each($('.signupPopup select.registerCustom'), function(i, el) {
            $(el).on('change', function(event) {
                var custom = $(event.target);
                var inputValue = custom.val();
                var target = $('#'+custom.attr('id')+'_value');
                target.val(inputValue);
            });
        });


    });
}));