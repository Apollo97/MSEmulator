
let SSAnim = (function () {
	function _base64ToArrayBuffer(base64) {
		var binary_string = window.atob(base64);
		var len = binary_string.length;
		var bytes = new Uint8Array(len);
		for (var i = 0; i < len; i++) {
			bytes[i] = binary_string.charCodeAt(i);
		}
		return bytes;
	}

	class SSAnim {
		constructor() {
			this.spine_data = null;
			this.spine_pose = null;
			this.spine_pose_next = null;
			this.atlas_data = null;

			this.anim_time = 0;
			this.anim_length = 0;
			this.anim_length_next = 0;
			this.anim_rate = 1;
			
			this.resource = null;
		}
		
		static GetRenderer() {
			return SSAnim.renderer;
		}
		static SetRenderingContext(ctx) {
			if (ctx instanceof CanvasRenderingContext2D) {
				SSAnim.renderer = new RenderCtx2D(ctx);
			}
			else if (ctx instanceof WebGLRenderingContext) {
				SSAnim.renderer = new RenderWebGL(ctx);
			}
		}
		
		async load(url) {
			let rawData = await $get.data(url);
			let fname;
			
			for (let file in rawData) {
				let re = file.match(/(.+)\.atlas$/);
				if (re) {
					fname = re[1];
				}
			}
			if (!fname) {
				throw new Error("No find *.atlas");
			}
			//if (!rawData[fname + ".json"] && rawData[fname]) {
			//}
			
			return await this._load(rawData, fname);
		}
		_load(rawData, fname) {
			let that = this;
			
			//let fname = "a_1";//"lusi";
			
			let json_text = rawData[fname + ".json"];
			let atlas_text = rawData[fname + ".atlas"];
			
			return new Promise(function (resolve, reject) {
				if (json_text) {
					let spine_data = window.aaa = JSON.parse(json_text);
					that.spine_data = new spine.Data().load(spine_data);
				}
				else {
					let buffer = _base64ToArrayBuffer(rawData[fname]);
					let reader = new SpineBinaryReader();
					let obj = reader.fromBuffer(buffer);
					window.aaa = reader;
					that.spine_data = new spine.Data().load(obj);
				}
				that.spine_pose = new spine.Pose(that.spine_data);
				that.spine_pose_next = new spine.Pose(that.spine_data);
				
				let images = {};

				let counter = 0;
				let counter_inc = function() {
					counter++;
				}
				let counter_dec = function() {
					if (--counter === 0) {
						that.resource = SSAnim.renderer.loadData(that.spine_data, that.atlas_data, images);
						that._updateFile();
						resolve();
					}
				}

				counter_inc();

				if (atlas_text) {
					that.atlas_data = new atlas.Data().import(atlas_text);

					// load atlas page images
					that.atlas_data.pages.forEach(function(page) {
						let image_key = page.name;
						let image_url = $get.imageUrl(rawData[image_key][""]);
						counter_inc();
						images[image_key] = loadImage(image_url, (function(page) {
							return function(err, image) {
								if (err) {
									console.log("error loading:", image && image.src || page.name);
								}
								page.w = page.w || image.width;
								page.h = page.h || image.height;
								counter_dec();
							}
						})(page));
					});
				}
				else {
					// load attachment images
					that.spine_data.iterateSkins(function(skin_key, skin) {
						skin.iterateAttachments(function(slot_key, skin_slot, attachment_key, attachment) {
							if (!attachment) {
								return;
							}
							switch (attachment.type) {
								case 'region':
								case 'mesh':
								case 'weightedmesh':
									let image_key = attachment_key;
									let image_url = file_path + that.spine_data.skeleton.images + image_key + ".png";
									counter_inc();
									images[image_key] = loadImage(image_url, function(err, image) {
										if (err) {
											console.log("error loading:", image.src);
										}
										counter_dec();
									});
									break;
							}
						});
					});
				}

				counter_dec();
			});
		}
		
		load_form_url(path, json_url, atlas_url="") {
			let that = this;
			let file_path = path;
			let file_json_url = json_url ? ("/data/" + file_path + json_url):"";
			let file_atlas_url = atlas_url ? ("/data/" + file_path + atlas_url):"";
				
			return new Promise(function (resolve, reject) {
				loadText(file_json_url, function(err, json_text) {
					if (err) {
						reject("loadFile: " + file_json_url);
						return;
					}

					that.spine_data = new spine.Data().load(JSON.parse(json_text));
					that.spine_pose = new spine.Pose(that.spine_data);
					that.spine_pose_next = new spine.Pose(that.spine_data);

					loadText(file_atlas_url, function(err, atlas_text) {
						let images = {};

						let counter = 0;
						let counter_inc = function() {
							counter++;
						}
						let counter_dec = function() {
							if (--counter === 0) {
								SSAnim.renderer.loadData(that.spine_data, that.atlas_data, images);
								that._updateFile();
								resolve({
									file_path,
									file_json_url,
									file_atlas_url
								});
							}
						}

						counter_inc();

						if (!err && atlas_text) {
							that.atlas_data = new atlas.Data().import(atlas_text);

							// load atlas page images
							let dir_path = file_path.slice(0, file_path.lastIndexOf('/'));
							that.atlas_data.pages.forEach(function(page) {
								let image_key = page.name;
								let image_url = "images/" + dir_path + "/" + image_key;
								//console.log("image_key: " + image_url);
								counter_inc();
								images[image_key] = loadImage(image_url, (function(page) {
									return function(err, image) {
										if (err) {
											console.log("error loading:", image && image.src || page.name);
										}
										page.w = page.w || image.width;
										page.h = page.h || image.height;
										counter_dec();
									}
								})(page));
							});
						} else {
							// load attachment images
							that.spine_data.iterateSkins(function(skin_key, skin) {
								skin.iterateAttachments(function(slot_key, skin_slot, attachment_key, attachment) {
									if (!attachment) {
										return;
									}
									switch (attachment.type) {
										case 'region':
										case 'mesh':
										case 'weightedmesh':
											let image_key = attachment_key;
											let image_url = file_path + that.spine_data.skeleton.images + image_key + ".png";
											counter_inc();
											images[image_key] = loadImage(image_url, function(err, image) {
												if (err) {
													console.log("error loading:", image.src);
												}
												counter_dec();
											});
											break;
									}
								});
							});
						}

						counter_dec();
					});
				});
			});
		}
		unload() {
			SSAnim.renderer.setResource(this.resource);
			SSAnim.renderer.dropData(this.spine_data, this.atlas_data);
		}
		
		_updateFile() {
			this.updateSkin(0);
			this.updateAnim(0);
		}

		get width() {
			return this.spine_data.skeleton.width;
		}
		get height() {
			return this.spine_data.skeleton.height;
		}
		
		get anim_time() {
			return this.spine_pose.getTime();
		}
		set anim_time(value) {
			if (this.spine_pose) {
				this.spine_pose.setTime(value);
				this.spine_pose_next.setTime(value);
			}
		}
		
		getAnimKeysCount(){
			return this.spine_data.anim_keys.length;
		}
		
		updateSkin(skin_index) {
			let skin_key = this.spine_data.skin_keys[skin_index];
			this.spine_pose.setSkin(skin_key);
			this.spine_pose_next.setSkin(skin_key);
		}

		updateAnim(anim_index) {
			this.anim_time = 0;
			let anim_key = this.spine_data.anim_keys[anim_index];
			this.spine_pose.setAnim(anim_key);
			this.anim_length = this.spine_pose.curAnimLength() || 1000;
			
			let anim_key_next = this.spine_data.anim_keys[(anim_index + 1) % this.spine_data.anim_keys.length];
			this.spine_pose_next.setAnim(anim_key_next);
			this.anim_length_next = this.spine_pose_next.curAnimLength() || 1000;
		}
		
		update(stamp) {
			this.spine_pose.update(stamp * this.anim_rate);
			let anim_rate_next = this.anim_rate * this.anim_length_next / this.anim_length;
			this.spine_pose_next.update(stamp * anim_rate_next);

			//let skin_key = this.spine_data.skin_keys[skin_index];
			//let anim_key = this.spine_data.anim_keys[anim_index];
			//let anim_key_next = this.spine_data.anim_keys[(anim_index + 1) % this.spine_data.anim_keys.length];
			//messages.innerHTML = "skin: " + skin_key + ", anim: " + anim_key + ", next anim: " + anim_key_next;

			this.spine_pose.strike();

			//this.spine_pose.events.forEach(function (event) { console.log("event", event.name, event.int_value, event.float_value, event.string_value); });

			if (SSAnim.ANIM_BLEND > 0) {
				this.spine_pose_next.strike();

				// blend next pose bone into pose bone
				this.spine_pose.iterateBones(function(bone_key, bone) {
					let bone_next = this.spine_pose_next.bones[bone_key];
					if (!bone_next) {
						return;
					}
					spine.Space.tween(bone.local_space, bone_next.local_space, SSAnim.ANIM_BLEND, bone.local_space);
				});

				// compute bone world space
				this.spine_pose.iterateBones(function(bone_key, bone) {
					spine.Bone.flatten(bone, this.spine_pose.bones);
				});
			}
		}
		
		render() {
			SSAnim.renderer.setResource(this.resource);
			
			SSAnim.renderer.drawPose(this.spine_pose, this.atlas_data);

			if (SSAnim.ENABLE_RENDER_DEBUG_DATA) {
				SSAnim.renderer.drawDebugData(this.spine_pose, this.atlas_data, {
					bone: true,
					ik: true,
				});
			}

			if (SSAnim.ENABLE_RENDER_DEBUG_POSE) {
				SSAnim.renderer.drawDebugPose(this.spine_pose, this.atlas_data, {
					bone: true,
					ik: true,
				});
			}
		}
	}
	SSAnim.ENABLE_RENDER_DEBUG_DATA = false;
	SSAnim.ENABLE_RENDER_DEBUG_POSE = false;
	SSAnim.ANIM_BLEND = 0.0;
	SSAnim.renderer = null;

	function loadText(url, callback) {
		let req = new XMLHttpRequest();
		if (url) {
			req.open("GET", url, true);
			//req.responseType = 'text';
			req.addEventListener('error', function() {
				callback("error", null);
			});
			req.addEventListener('abort', function() {
				callback("abort", null);
			});
			req.addEventListener('load', function() {
					if (req.status === 200) {
						callback(null, JSON.parse(req.response));
					} else {
						callback(req.response, null);
					}
				});
			req.send();
		} else {
			callback("error", null);
		}
		return req;
	}

	function loadImage(url, callback) {
		let image = new Image();
		image.crossOrigin = "Anonymous";
		image.addEventListener('error', function() {
			callback("error", null);
		});
		image.addEventListener('abort', function() {
			callback("abort", null);
		});
		image.addEventListener('load', function() {
			callback(null, image);
		});
		image.src = url;
		return image;
	}
	
	return SSAnim;
})();
