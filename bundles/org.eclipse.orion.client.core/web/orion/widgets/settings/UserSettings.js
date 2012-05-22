/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: Anton McConville - IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global dojo dijit widgets orion  window console define localStorage*/
/*jslint browser:true*/

/* This SettingsContainer widget is a dojo border container with a left and right side. The left is for choosing a 
   category, the right shows the resulting HTML for that category. */

define(['i18n!settings/nls/messages', 'require', 'dojo', 'dijit', 'orion/util', 'orion/commands', 'orion/widgets/settings/LabeledTextfield', 'orion/widgets/settings/LabeledCheckbox', 'orion/widgets/settings/LabeledToggle', 'profile/UsersService', 'orion/widgets/settings/Section' ], function(messages, require, dojo, dijit, mUtil, mCommands) {

	dojo.declare("orion.widgets.settings.UserSettings", [dijit._Widget, dijit._Templated], { //$NON-NLS-0$
	
		// templateString: '<input type="text" name="myname" data-dojo-attach-point="textfield" data-dojo-attach-event="onchange:change"/>',
		
		templateString: '<div>' +  //$NON-NLS-0$
							'<div data-dojo-attach-point="table" class="displayTable">' +  //$NON-NLS-0$
								'<h1 id="General">'+messages['User Profile']+'</h1>' +  //$NON-NLS-2$ //$NON-NLS-0$
								'<div data-dojo-attach-point="sections">' + //$NON-NLS-0$
								'</sections>' + //$NON-NLS-0$
							'</div>' + //$NON-NLS-0$
						'</div>', //$NON-NLS-0$
		
		postCreate: function(){
			
			this.inherited( arguments );
			
			/* - account ----------------------------------------------------- */
			
			this.accountFields = [];
			
			this.accountFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Username'], editmode:'readonly'} ) ); //$NON-NLS-1$
			this.accountFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Full Name']} ) );
			this.accountFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Email Address']} ) );
			
			var accountSection = new orion.widgets.settings.Section( {sectionName:messages['Account'], container: this.sections, sections: this.accountFields } );
			
			accountSection.startup();
			
			/* - password ---------------------------------------------------- */
			
			this.passwordFields = [];
			
			this.passwordFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Current Password'], inputType:'password'} ) ); //$NON-NLS-1$
			this.passwordFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['New Password'], inputType:'password'} ) ); //$NON-NLS-1$
			this.passwordFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Verify Password'], inputType:'password'} ) ); //$NON-NLS-1$
			
			var passwordSection = new orion.widgets.settings.Section( {sectionName:messages['Password'], container: this.sections, sections: this.passwordFields } );
			
			/* - linked ------------------------------------------------------ */
			
			this.linkedFields = [];
			
			var toggleLabels = [ messages['Google'], messages['Yahoo'], messages['AOL'], messages['OpenId'] ];
			
			var openIds = [ 'https://www.google.com/accounts/o8/id', 'http://me.yahoo.com', 'http://openid.aol.com/', 'http://myopenid.com' ];//$NON-NLS-0$ //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			
			var toggleData = {toggleOnState:messages["Linked"], toggleOffState:messages["Unlinked"], toggleOnSwitch:messages['Link'], toggleOffSwitch:messages['Unlink']};
			
			for( var toggle = 0; toggle< 4; toggle++ ){
				toggleData.fieldlabel = toggleLabels[toggle];
				
				var toggleWidget = new orion.widgets.settings.LabeledToggle( toggleData );
				
				toggleWidget.onAction = dojo.hitch( this, 'confirmOpenId', openIds[toggle] ); //$NON-NLS-0$
				
				this.linkedFields.push( toggleWidget );
				
			}
			
			var linkedSection = new orion.widgets.settings.Section( {sectionName:messages['Linked Accounts'], container: this.sections, sections: this.linkedFields } );

			/* - git --------------------------------------------------------- */
			
			this.gitFields = [];
			
			this.gitFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Git Email Address']} ) );
			this.gitFields.push( new orion.widgets.settings.LabeledTextfield( {fieldlabel:messages['Git Username']} ) );
			
			var gitSection = new orion.widgets.settings.Section( {sectionName:messages['Git Credentials'], container: this.sections, sections: this.gitFields } );
			
			var updateCommand = new mCommands.Command({
				name: messages["Update"],
				tooltip: messages["Update Profile Settings"],
				id: "orion.updateprofile", //$NON-NLS-0$
				callback: dojo.hitch(this, function(data){
					this.update(data.items);
				})
			
			});
			
			this.commandService.addCommand(updateCommand);

			this.commandService.registerCommandContribution('profileCommands', "orion.updateprofile", 2); //$NON-NLS-1$ //$NON-NLS-0$
			
			this.commandService.renderCommands('profileCommands', this.toolbarID, this, this, "button"); //$NON-NLS-1$ //$NON-NLS-0$
			
			this.startUp();
		},
		
		confirmOpenId: function(openid){
			if (openid !== "" && openid !== null) {
				this.win = window.open( "../mixlogin/manageopenids/openid?openid=" + encodeURIComponent(openid),"openid_popup", "width=790,height=580" ); //$NON-NLS-2$ //$NON-NLS-1$ //$NON-NLS-0$
			}
		},
		
		update: function(data){
			console.log( 'update' ); //$NON-NLS-0$
			
			var authenticationIds = [];
			
			var authServices = this.registry.getServiceReferences("orion.core.auth"); //$NON-NLS-0$
			
			var messageService = this.registry.getService("orion.page.message"); //$NON-NLS-0$
			
			var userService = this.userService;
			
			var settingsWidget = this;
			
			var userdata = {};
			
			userdata.GitMail = settingsWidget.gitFields[0].getValue();
			userdata.GitName = settingsWidget.gitFields[1].getValue();
			
			userdata.login = settingsWidget.accountFields[0].getValue();
			userdata.Name = settingsWidget.accountFields[1].getValue();
			userdata.email = settingsWidget.accountFields[2].getValue();
			
//			userdata.password = settingsWidget.passwordFields[1].getValue();
//			userdata.passwordRetype = settingsWidget.passwordFields[1].getValue();

//			if( userdata.password === userdata.passwordRetype ){
			
			for(var i=0; i<authServices.length; i++){
				var servicePtr = authServices[i];
				var authService = this.registry.getService(servicePtr);		

				authService.getKey().then(function(key){
					authenticationIds.push(key);
					authService.getUser().then(function(jsonData){
					
						var data = jsonData;
						
						var b = userService.updateUserInfo(jsonData.Location, userdata).then( function(args){
							messageService.setProgressResult( messages['User profile data successfully reset.'] );
							
							if( userdata.Name ){
							
								var userMenu = dijit.byId( 'logins' ); //$NON-NLS-0$
								
								userMenu.set( 'label', userdata.Name  ); //$NON-NLS-0$
							
							}
							
						});
					});
				});
			}		
//			}else{
//				messageService.setProgressResult( 'New password, and retyped password do not match' );
//			}
		},
		
		startUp:function(){
			
			this.userService = this.registry.getService("orion.core.user"); //$NON-NLS-0$
			
			var authenticationIds = [];
			
			var authServices = this.registry.getServiceReferences("orion.core.auth"); //$NON-NLS-0$
			
			var userService = this.userService;
			
			var settingsWidget = this;
			
			for(var i=0; i<authServices.length; i++){
				var servicePtr = authServices[i];
				var authService = this.registry.getService(servicePtr);		

				authService.getKey().then(function(key){
					authenticationIds.push(key);
					authService.getUser().then(function(jsonData){
					
						var data = jsonData;
						
						var b = userService.getUserInfo(jsonData.Location).then( function( accountData ){

							settingsWidget.accountFields[0].setValue( accountData.login );
							settingsWidget.accountFields[1].setValue( accountData.Name );
							settingsWidget.accountFields[2].setValue( accountData.email );
							
							settingsWidget.gitFields[0].setValue( accountData.GitMail );
							settingsWidget.gitFields[1].setValue( accountData.GitName );							
						});
					});
				});
			}
		}
	});
});

