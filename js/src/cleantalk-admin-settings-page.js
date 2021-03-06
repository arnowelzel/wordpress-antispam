jQuery(document).ready(function(){

	// Crunch for Right to Left direction languages
	if(getComputedStyle(document.getElementsByClassName('apbct_settings-title')[0]).direction === 'rtl'){
		jQuery('.apbct_switchers').css('text-align', 'right');
	}

	// Show/Hide access key
    jQuery('#apbct_showApiKey').on('click', function(){
        jQuery('.apbct_setting---apikey').val(jQuery('.apbct_setting---apikey').attr('key'));
        jQuery('.apbct_setting---apikey+div').show();
        jQuery(this).fadeOut(300);
    });

	var d = new Date();
	jQuery('#ct_admin_timezone').val(d.getTimezoneOffset()/60*(-1));
	
	// GDPR modal window
	jQuery('#apbct_gdpr_open_modal').on('click', function(){
		jQuery('#gdpr_dialog').dialog({
			modal:true, 
			show: true,
			position: { my: "center", at: "center", of: window },
			width: +(jQuery('#wpbody').width() / 100 * 70), // 70% of #wpbody
			height: 'auto',
			title: 'GDPR compliance',
			draggable: false,
			resizable: false,
			closeText: "Close",
		});
	});

	// Sync button
	jQuery('#apbct_button__sync').on('click', function(){
		apbct_admin_sendAJAX(
			{action: 'apbct_sync'},
			{
				button: document.getElementById('apbct_button__sync' ),
				spinner: jQuery('#apbct_button__sync .apbct_preloader_button' ),
				callback: function(result, data, params, obj){
					jQuery('.apbct_success').show(300);
					setTimeout(function(){jQuery('.apbct_success').hide(300);}, 2000)
					if(result.reload)
						document.location.reload();
				}
			}
		);
	});

	if( ctSettingsPage.key_changed )
		jQuery('#apbct_button__sync').click();

	jQuery(document).on('click', '.apbct_settings-long_description---show', function(){
		self = jQuery(this);
		apbct_settings__showDescription(self, self.attr('setting'));
	});

	if (jQuery('#apbct_renew_notice').length || jQuery('#apbct_trial_notice').length) 
		apbct_banner_check();
	
});

/**
 * Checking current account status for renew notice
 */
function apbct_banner_check() {
	var bannerChecker = setInterval( function() {
		apbct_admin_sendAJAX(
			{action: 'apbct_settings__check_renew_banner'},
			{
				callback: function(result, data, params, obj){
					if (result.close_renew_banner) {
						if (jQuery('#apbct_renew_notice').length)
							jQuery('#apbct_renew_notice').hide('slow');
						if (jQuery('#apbct_trial_notice').length)
							jQuery('#apbct_trial_notice').hide('slow');
						clearInterval(bannerChecker);
					}
				}
			}
		);
	}, 900000);
}

/**
 * Select elems like #{selector} or .{selector}
 * Selector passed in string separated by ,
 *
 * @param elems
 * @returns {*}
 */
function apbct_get_elems(elems){
    elems = elems.split(',');
    for( var i=0, len = elems.length, tmp; i < len; i++){
        tmp = jQuery('#'+elems[i]);
        elems[i] = tmp.length === 0 ? jQuery('.'+elems[i]) : tmp;
    }
    return elems;
}

/**
 * Select elems like #{selector} or .{selector}
 * Selector could be passed in a string ( separated by comma ) or in array ( [ elem1, elem2, ... ] )
 *
 * @param elems string|array
 * @returns array
 */
function apbct_get_elems__native(elems){

	// Make array from a string
	if(typeof elems === 'string')
		elems = elems.split(',');

	var out = [];

	elems.forEach(function(elem, i, arr) {

		// try to get elements with such IDs
		var tmp = document.getElementById(elem);
		if (tmp !== null){
			out.push( tmp[key] );
			return;
		}

		// try to get elements with such class name
		// write each elem from collection to new element of output array
		tmp = document.getElementsByClassName(elem);
		if (tmp !== null && tmp.length !==0 ){
			for(key in tmp){
				if( +key >= 0 ){
					out.push( tmp[key] );
				}
			}
		}
	});

	return out;
}

function apbct_show_hide_elem(elems){
	elems = apbct_get_elems(elems);
    for( var i=0, len = elems.length; i < len; i++){
        elems[i].each(function (i, elem) {
            elem = jQuery(elem);
            var label = elem.next('label') || elem.prev('label') || null;
            if (elem.is(":visible")) {
                elem.hide();
                if (label) label.hide();
            } else {
                elem.show();
                if (label) label.show();
            }
        });
    }
}

/**
 * Settings dependences. Switch|toggle depended elements state (disabled|enabled)
 * Recieve list of selectors ( without class mark (.) or id mark (#) )
 *
 * @param ids string|array Selectors
 * @param enable
 */
function apbctSettingsDependencies(ids, enable){


	enable = ! isNaN(enable) ? enable : null;

	// Get elements
	var elems = apbct_get_elems__native( ids );

	elems.forEach(function(elem, i, arr){

		console.log( elem.getAttribute('id') );

		var do_disable = function(){elem.setAttribute('disabled', 'disabled');},
			do_enable  = function(){elem.removeAttribute('disabled');};

		// Set defined state
		if(enable === null) // Set
			enable = elem.getAttribute('disabled') === null ? 0 : 1;

		enable === 1 ? do_enable() : do_disable();

		if( elem.getAttribute('apbct_children') !== null){
			var state = apbctSettingsDependencies_getState( elem ) && enable;
			if( state !== null ) {
				apbctSettingsDependencies( elem.getAttribute('apbct_children'), state  );
			}
		}

	});
}

function apbctSettingsDependencies_getState( elem ){

	var state;

	switch ( elem.getAttribute( 'type' ) ){
		case 'checkbox':
			state = +elem.checked;
			break;
		case 'radio':
			state = +(+elem.getAttribute('value') === 1);
			break;
		default:
			state = null;
	}

	return state;
}

function apbct_settings__showDescription(label, setting_id){

	var remove_desc_func = function(e){
		if(typeof e === 'undefined' || ((jQuery(e.target).parent('.apbct_long_desc').length == 0 || jQuery(e.target).hasClass('apbct_long_desc__cancel')) && !jQuery(e.target).hasClass('apbct_long_description__show'))){
			jQuery('.apbct_long_desc').remove();
			jQuery(document).off('click', remove_desc_func);
		}
	};

	remove_desc_func();

	label.after("<div id='apbct_long_desc__"+setting_id+"' class='apbct_long_desc'></div>");
	var obj = jQuery('#apbct_long_desc__'+setting_id);
	obj.append("<i class='icon-spin1 animate-spin'></i>")
		.append("<div class='apbct_long_desc__angle'></div>")
		.css({
			top: label.position().top - 5,
			left: label.position().left + 25
		});


	apbct_admin_sendAJAX(
		{action: 'apbct_settings__get_description', setting_id: setting_id},
		{
			spinner: obj.children('img'),
			callback: function(result, data, params, obj){

				obj.empty()
					.append("<div class='apbct_long_desc__angle'></div>")
					.append("<i class='apbct_long_desc__cancel icon-cancel'></i>")
					.append("<h3 class='apbct_long_desc__title'>"+result.title+"</h3>")
					.append("<p>"+result.desc+"</p>");

				jQuery(document).on('click', remove_desc_func);
			}
		},
		obj
	);
}