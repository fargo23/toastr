/*
 * No jQuery Toastr
 * Authors: Bohdan Zolotukhin
 * All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * Most part of this code is the fork of:
 *----------------------------------------------------------------
 * Toastr
 * Copyright 2012-2015
 * Authors: John Papa, Hans Fjällemark, and Tim Ferrell.
 * All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 * ARIA Support: Greta Krafsig
 *
 * Project: https://github.com/CodeSeven/toastr
 *--------------------------------------------------------------
 *
 */
/* global define */
function Toastr () {
    var $container,
        listener,
        toastId = 0,
        animate = returnAnimateFunction(),
        animations = {
            fadeOut: fadeOut
        },
        toastType = {
            error: 'error',
            info: 'info',
            success: 'success',
            warning: 'warning'
        },
        toastr = {
            // clear: clear,
            remove: remove,
            error: error,
            getContainer: getContainer,
            info: info,
            options: {},
            subscribe: subscribe,
            success: success,
            version: '1.0',
            warning: warning
        },
        previousToast;

    return toastr;

    //------------------------------------------------------------------

    function error(message, title, optionsOverride) {
        return notify({
            type: toastType.error,
            iconClass: getOptions().iconClasses.error,
            message: message,
            optionsOverride: optionsOverride,
            title: title
        });
    }

    function getContainer(options, create) {
        if (!options) {
            options = getOptions();
        }
        $container = document.getElementById(options.containerId);
        if ($container) {
            return $container;
        }
        if (create) {
            $container = createContainer(options);
        }
        return $container;
    }

    function info(message, title, optionsOverride) {
        return notify({
            type: toastType.info,
            iconClass: getOptions().iconClasses.info,
            message: message,
            optionsOverride: optionsOverride,
            title: title
        });
    }

    function subscribe(callback) {
        listener = callback;
    }

    function success(message, title, optionsOverride) {
        return notify({
            type: toastType.success,
            iconClass: getOptions().iconClasses.success,
            message: message,
            optionsOverride: optionsOverride,
            title: title
        });
    }

    function warning(message, title, optionsOverride) {
        return notify({
            type: toastType.warning,
            iconClass: getOptions().iconClasses.warning,
            message: message,
            optionsOverride: optionsOverride,
            title: title
        });
    }

    function remove(toastElement) {
        var options = getOptions();
        if (!$container) {
            getContainer(options);
        }
        if (toastElement && document.activeElement === toastElement) {
            removeToast(toastElement);
            return;
        }
        if ($container.children.length) {
            $container.parentElement.removeChild($container);
        }
    }

    function createContainer(options) {
        var parent = document.querySelector(options.target),
            temp = document.createElement('div');
        temp.id = options.containerId;
        temp.className = options.positionClass;
        $container = temp;
        parent.appendChild($container);
        return $container;
    }

    function getDefaults() {
        return {
            tapToDismiss: true,
            toastClass: 'toast',
            containerId: 'toast-container',
            debug: false,

            showMethod: 'fadeIn', //fadeIn, slideDown, and show are built into jQuery
            showDuration: 300,
            showEasing: 'swing', //swing and linear are built into jQuery
            onShown: undefined,
            hideMethod: 'fadeOut',
            hideDuration: 1000,
            hideEasing: 'swing',
            onHidden: undefined,
            closeMethod: false,
            closeDuration: false,
            closeEasing: false,
            closeOnHover: true,

            extendedTimeOut: 1000,
            iconClasses: {
                error: 'toast-error',
                info: 'toast-info',
                success: 'toast-success',
                warning: 'toast-warning'
            },
            iconClass: 'toast-info',
            positionClass: 'toast-top-right',
            timeOut: 5000, // Set timeOut and extendedTimeOut to 0 to make it sticky
            titleClass: 'toast-title',
            messageClass: 'toast-message',
            escapeHtml: false,
            target: 'body',
            closeHtml: '<button type="button">&times;</button>',
            closeClass: 'toast-close-button',
            newestOnTop: true,
            preventDuplicates: false,
            progressBar: false,
            progressClass: 'toast-progress',
            rtl: false
        };
    }

    function publish(args) {
        if (!listener) {
            return;
        }
        listener(args);
    }

    function mergeObjects(to, from) {
        for (var key in from) {
            to[key] = from[key];
        }
        return to;
    }

    function notify(map) {
        var options = getOptions();
        var iconClass = map.iconClass || options.iconClass;
        if (typeof (map.optionsOverride) !== 'undefined') {
            mergeObjects(options, map.optionsOverride);
            iconClass = map.optionsOverride.iconClass || iconClass;
        }
        if (shouldExit(options, map)) {
            return;
        }
        toastId++;
        $container = getContainer(options, true);

        var intervalId = null,
            $toastElement = document.createElement('div'),
            $titleElement = document.createElement('div'),
            $messageElement = document.createElement('div'),
            $progressElement = document.createElement('div'),
            temp = document.createElement('div'), $closeElement,
            progressBar = {
                intervalId: null,
                hideEta: null,
                maxHideTime: null
            },
            response = {
                toastId: toastId,
                state: 'visible',
                startTime: new Date(),
                options: options,
                map: map
            };
        temp.innerHTML = options.closeHtml;
        $closeElement = temp.firstChild;
        personalizeToast();

        displayToast();

        handleEvents();

        publish(response);

        if (options.debug && console) {
            console.log(response);
        }

        return $toastElement;

        function escapeHtml(source) {
            if (source == null) {
                source = '';
            }

            return source
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        function personalizeToast() {
            setIcon();
            setTitle();
            setMessage();
            setCloseButton();
            setProgressBar();
            setRTL();
            setSequence();
            setAria();
        }

        function setAria() {
            var ariaValue = '';
            switch (map.iconClass) {
                case 'toast-success':
                case 'toast-info':
                    ariaValue = 'polite';
                    break;
                default:
                    ariaValue = 'assertive';
            }
            $toastElement.setAttribute('aria-live', ariaValue);
        }

        function handleEvents() {
            if (options.closeOnHover) {
                $toastElement.addEventListener('mouseenter', stickAround);
                $toastElement.addEventListener('mouseleave', delayedHideToast);
            }

            if (!options.onclick && options.tapToDismiss) {
                $toastElement.addEventListener('click', hideToast);
            }

            if (options.closeButton && $closeElement) {
                $closeElement.addEventListener('click', function (event) {
                    if (event.stopPropagation) {
                        event.stopPropagation();
                    } else if (event.cancelBubble !== undefined && event.cancelBubble !== true) {
                        event.cancelBubble = true;
                    }
                    if (options.onCloseClick) {
                        options.onCloseClick(event);
                    }
                    hideToast(true);
                });
            }

            if (options.onclick) {
                $toastElement.addEventListener('click', function (event) {
                    options.onclick(event);
                    hideToast();
                });
            }
        }

        function displayToast() {
            // $toastElement.style.display = 'none';
            // $toastElement[options.showMethod](
            //     {duration: options.showDuration, easing: options.showEasing, complete: options.onShown}
            // );
            console.log('options.showEasing', options.showEasing);
            fadeIn($toastElement, options.showDuration, null /*options.showEasing*/, options.onShown);

            if (options.timeOut > 0) {
                intervalId = setTimeout(hideToast, options.timeOut);
                progressBar.maxHideTime = parseFloat(options.timeOut);
                progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                if (options.progressBar) {
                    progressBar.intervalId = setInterval(updateProgress, 10);
                }
            }
        }

        function setIcon() {
            if (map.iconClass) {
                $toastElement.classList.add(options.toastClass);
                $toastElement.classList.add(iconClass);
            }
        }

        function setSequence() {
            if (options.newestOnTop) {
                $container.insertBefore($toastElement, $container.firstElementChild);
            } else {
                $container.appendChild($toastElement);
            }
        }

        function setTitle() {
            if (!map.title) {
                return;
            }
            if (options.escapeHtml) {
                $titleElement.textContent = escapeHtml(map.title);
            }
            else {
                $titleElement.innerHTML = map.title;
            }
            $titleElement.className = options.titleClass;
            $toastElement.appendChild($titleElement);

        }

        function setMessage() {
            if (!map.message) {
                return;
            }
            if (options.escapeHtml) {
                $messageElement.innerHTML = escapeHtml(map.message);
            }
            else {
                $messageElement.innerHTML = map.message;
            }
            $messageElement.className = options.messageClass;
            $toastElement.appendChild($messageElement);

        }

        function setCloseButton() {
            if (options.closeButton) {
                $closeElement.className = options.closeClass;
                $closeElement.setAttribute('role', 'button');
                $toastElement.insertBefore($closeElement, $toastElement.firstElementChild);
            }
        }

        function setProgressBar() {
            if (options.progressBar) {
                $progressElement.className = options.progressClass;
                $toastElement.insertBefore($progressElement, $toastElement.firstElementChild);
            }
        }

        function setRTL() {
            if (options.rtl) {
                $toastElement.classList.add('rtl');
            }
        }

        function shouldExit(options, map) {
            if (options.preventDuplicates) {
                if (map.message === previousToast) {
                    return true;
                } else {
                    previousToast = map.message;
                }
            }
            return false;
        }

        function hideToast(override) {
            var method = override && options.closeMethod !== false ? options.closeMethod : options.hideMethod,
                duration = override && options.closeDuration !== false ? options.closeDuration : options.hideDuration,
                easing = override && options.closeEasing !== false ? options.closeEasing : options.hideEasing;
            if (document.activeElement === $toastElement && !override) {
                return;
            }
            clearTimeout(progressBar.intervalId);
            fadeOut($toastElement, duration, null /*easing*/, function () {
                removeToast($toastElement);
                clearTimeout(intervalId);
                if (options.onHidden && response.state !== 'hidden') {
                    options.onHidden();
                }
                response.state = 'hidden';
                response.endTime = new Date();
                publish(response);
            });
            return $toastElement;
        }

        function delayedHideToast() {
            if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                intervalId = setTimeout(hideToast, options.extendedTimeOut);
                progressBar.maxHideTime = parseFloat(options.extendedTimeOut);
                progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
            }
        }

        function stickAround() {
            clearTimeout(intervalId);
            progressBar.hideEta = 0;
            // $toastElement.stop(true, true)[options.showMethod](
            //     {duration: options.showDuration, easing: options.showEasing}
            // );
        }

        function updateProgress() {
            var percentage = ((progressBar.hideEta - (new Date().getTime())) / progressBar.maxHideTime) * 100;
            $progressElement.style.width = percentage + '%';
        }
    }

    function getOptions() {
        return mergeObjects(getDefaults(), toastr.options);
    }

    function removeToast(toastElement) {
        if (!$container) {
            $container = getContainer();
        }
        // if ($toastElement.style.display !== 'none' &&
        //     $toastElement.offsetHeight > 0 && $toastElement.offsetWidth > 0) {
        //     return;
        // }
        if (toastElement.parentElement) {
            toastElement.parentElement.removeChild(toastElement);
        }
        toastElement = null;
        if ($container.children.length === 0) {
            $container.parentElement.removeChild($container);
            previousToast = undefined;
        }
    }

    function fadeIn(elem, duration, timing, callback) {
        var initOpacity = parseFloat(window.getComputedStyle(elem).opacity);
        elem.style.opacity = '0';
        elem.style.display = '';
        animate({
            duration: duration,
            timing: timing,
            draw: function (p) {
                elem.style.opacity = (initOpacity * p).toString().slice(0,5);
            },
            done: function () {
                elem.style.opacity = '';
                if (callback) {
                    callback();
                }
            }
        });
    }

    function fadeOut(elem, duration, timing, callback) {
        var initOpacity = parseFloat(window.getComputedStyle(elem).opacity);
        animate({
            duration: duration,
            timing: timing,
            draw: function (p) {
                elem.style.opacity = (initOpacity - initOpacity * p).toString().slice(0,5);
            },
            done: function () {
                elem.style.display = 'none';
                elem.style.opacity = '';
                if (callback) {
                    callback();
                }
            }
        });
    }


    function returnAnimateFunction() {
        var requestAnimation = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (f) {
                setTimeout(f, 20);
            };
        return function (options) {
            // options = {
            //    duration: Number,
            //    timing: Function(time:Number),
            //    draw: Function(progress:Number)
            //    done: Function()
            // }
            var start = Date.now();
            options.timing = options.timing || function (t) { return t; };
            requestAnimation(function animate() {
                var timePassed = Date.now() - start,
                    timeFraction = timePassed / options.duration,
                    progress;
                if (timeFraction > 1) {
                    timeFraction = 1;
                }
                progress = options.timing(timeFraction);
                options.draw(progress);
                if (timeFraction < 1) {
                    requestAnimation(animate);
                }
                else if (options.done) {
                    options.done();
                }
            });
        };
    }
}