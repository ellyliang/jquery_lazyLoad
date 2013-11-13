/*
 * Lazy Load - jQuery plugin for lazy loading images
 *
 * Copyright (c) 2007-2013 Mika Tuupola
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   http://www.appelsiini.net/projects/lazyload
 *
 * Version:  1.9.0
 *
 */
 
(function($, window, document, undefined) {
    var $window = $(window)

    // Puts those functions out of the `fn.lazyload` scope so that be run only once.
    function belowthefold(element, settings) {
        var fold;
    
        if (settings.container === undefined || settings.container === window) {
            fold = (window.innerHeight ? window.innerHeight : $window.height()) + $window.scrollTop();
        } else {
            fold = $(settings.container).offset().top + $(settings.container).height();
        }

        return fold <= $(element).offset().top - settings.threshold;
    }

    function rightoffold(element, settings) {
        var fold;

        if (settings.container === undefined || settings.container === window) {
            fold = $window.width() + $window.scrollLeft();
        } else {
            fold = $(settings.container).offset().left + $(settings.container).width();
        }

        return fold <= $(element).offset().left - settings.threshold;
    }

    function abovethetop(element, settings) {
        var fold;
    
        if (settings.container === undefined || settings.container === window) {
            fold = $window.scrollTop();
        } else {
            fold = $(settings.container).offset().top;
        }

        return fold >= $(element).offset().top + settings.threshold  + $(element).height();
    }

    function leftofbegin(element, settings) {
        var fold;
        
        if (settings.container === undefined || settings.container === window) {
            fold = $window.scrollLeft();
        } else {
            fold = $(settings.container).offset().left;
        }

        return fold >= $(element).offset().left + settings.threshold + $(element).width();
    }

    function update(elements, settings) {
        var counter = 0;
    
        elements.each(function() {
            var $this = $(this);
            if (settings.skip_invisible && !$this.is(":visible")) { // something need to do for support zepto
                return;
            }
            if (abovethetop(this, settings) ||
                leftofbegin(this, settings)) {
                    /* Nothing. */
            } else if (!belowthefold(this, settings) &&
                !rightoffold(this, settings)) {
                    $this.trigger("appear");
                    /* if we found an image we'll load, reset the counter */
                    counter = 0;
            } else {
                if (++counter > settings.failure_limit) {
                    return false;
                }
            }
        });

    }

    $.fn.lazyload = function(options) {
        var elements = this,
            $container,
            settings = {
                threshold       : 0,
                failure_limit   : 0,
                event           : "scroll",
                effect          : "show",
                container       : window,
                data_attribute  : "original",
                skip_invisible  : true,
                appear          : null,
                load            : null,
                placeholder     : 'http://webmap4.map.bdimg.com/yyfm/lazyload/0.0.1/img/placeholder.png' // Support IE6\7 that does not support data image
            }

        if(options) {
            $.extend(settings, options);
        }

        /* Cache container as jQuery as object. */
        $container = (settings.container === undefined ||
                      settings.container === window) ? $window : $(settings.container);

        /* Fire one scroll event per scroll. Not one scroll event per image. */
        if (0 === settings.event.indexOf("scroll")) {
            $container.on(settings.event, function() {
                return update(elements, settings);
            });
        }

        this.each(function() {
            var self = this;
            var $self = $(self);

            self.loaded = false;

            /* If no src attribute given use data:uri. */
            if ($self.attr("src") === undefined || $self.attr("src") === false) {
                $self.attr("src", settings.placeholder);
            }
            
            /* When appear is triggered load original image. */
            $self.one("appear", function() {
                if (!this.loaded) {
                    if (settings.appear) {
                        var elements_left = elements.length;
                        settings.appear.call(self, elements_left, settings);
                    }
                    $("<img />")
                        .on("load", function() {
                            var original = $self.data(settings.data_attribute);
                            $self.hide();
                            if ($self.is("img")) {
                                $self.attr("src", original);
                            } else {
                                $self.css("background-image", "url('" + original + "')");
                            }
                            $self[settings.effect](settings.effect_speed);
                            
                            self.loaded = true;

                            /* Remove image from array so it is not looped next time. */
                            var temp = $.grep(elements, function(element) {
                                return !element.loaded;
                            });
                            elements = $(temp);

                            if (settings.load) {
                                var elements_left = elements.length;
                                settings.load.call(self, elements_left, settings);
                            }
                        })
                        .attr("src", $self.data(settings.data_attribute));
                }
            });

            /* When wanted event is triggered load original image */
            /* by triggering appear.                              */
            if (0 !== settings.event.indexOf("scroll")) {
                $self.on(settings.event, function() {
                    if (!self.loaded) {
                        $self.trigger("appear");
                    }
                });
            }
        });

        /* Check if something appears when window is resized. */
        $window.on("resize", function() {
            update(elements, settings);
        });
              
        /* With IOS5 force loading images when navigating with back button. */
        /* Non optimal workaround. */
        if ((/iphone|ipod|ipad.*os 5/gi).test(navigator.appVersion)) {
            $window.on("pageshow", function(event) {
                if (event.originalEvent && event.originalEvent.persisted) {
                    elements.each(function() {
                        $(this).trigger("appear");
                    });
                }
            });
        }

        /* Force initial check if images should appear. */
        $(document).ready(function() {
            update(elements, settings);
        });
        
        return this;
    };

})(jQuery, window, document);
