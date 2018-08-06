
class BinaryReader {
	constructor(arrayBuffer) {
		this._c = 0;
		this._b = new Uint8Array(arrayBuffer);
	}
	
	get byte() {
		return this._b[this._c];
	}
	readByte() {
		return this._b[this._c++];
	}
	peekByte(seek) {
		return this._b[this._c + seek];
	}
	
	get boolean() {
		return !!this._b[this._c];
	}
	readBoolean() {
		let b = this.readByte();
		return !!b;
	}
	
	get short() {
		return (this.byte << 8) | this.peekByte(1);
	}
	readShort() {
		return (this.readByte() << 8) | this.readByte();
	}
	
	get int() {
		return (this.byte << 24) | (this.peekByte(1) << 16) | (this.peekByte(2) << 8) | this.peekByte(3);
	}
	readInt() {
		return (this.readByte() << 24) | (this.readByte() << 16) | (this.readByte() << 8) | this.readByte();
	}
	
	get varint() {
		let b = this.byte;
		let value = b & 0x7F;
		if (b & 0x80) {
			b = this.peekByte(1);
			value |= (b & 0x7F) << 7;
			if (b & 0x80) {
				b = this.peekByte(2);
				value |= (b & 0x7F) << 14;
				if (b & 0x80) {
					b = this.peekByte(3);
					value |= (b & 0x7F) << 21;
					if (b & 0x80) value |= (this.peekByte(4) & 0x7F) << 28;
				}
			}
		}
		value = ((value >> 1) ^ -(value & 1));
		return value;
	}
	get varint_opt() {
		let b = this.byte;
		let value = b & 0x7F;
		if (b & 0x80) {
			b = this.peekByte(1);
			value |= (b & 0x7F) << 7;
			if (b & 0x80) {
				b = this.peekByte(2);
				value |= (b & 0x7F) << 14;
				if (b & 0x80) {
					b = this.peekByte(3);
					value |= (b & 0x7F) << 21;
					if (b & 0x80) value |= (this.peekByte(4) & 0x7F) << 28;
				}
			}
		}
		return value;
	}
	readVarint(optimizePositive) {
		let b = this.readByte();
		let value = b & 0x7F;
		if (b & 0x80) {
			b = this.readByte();
			value |= (b & 0x7F) << 7;
			if (b & 0x80) {
				b = this.readByte();
				value |= (b & 0x7F) << 14;
				if (b & 0x80) {
					b = this.readByte();
					value |= (b & 0x7F) << 21;
					if (b & 0x80) value |= (this.readByte() & 0x7F) << 28;
				}
			}
		}
		if (!optimizePositive) value = ((value >> 1) ^ -(value & 1));
		return value;
	}
	
	get float() {
		let v = this._b.slice(this._c, this._c + 4).reverse();
		let f = new Float32Array(v.buffer);
		return f[0];
	}
	readFloat() {
		let v = this._b.slice(this._c, this._c + 4).reverse();
		if (v.length != 4) {
			debugger;
		}
		this._c += 4;
		let f = new Float32Array(v.buffer);
		return f[0];
	}
	
	get string() {
		let maxLength = 1024;
		let utf8decoder = new TextDecoder("utf-8");
		let count = this.byte;//this.readVarint(true);
		if (count-- > 1) {
			if (count >= maxLength) {
				count = maxLength - 1;
			}
			let bytes = new Uint8Array(count);
			for (let i = 0; i < count; i++) {
				bytes[i] = this.peekByte(i + 1);
			}
			bytes[count] = "\0";
			return utf8decoder.decode(bytes);
		}
		//return null;
	}
	readString(maxLength=1024) {
		let utf8decoder = new TextDecoder("utf-8");
		let count = this.readByte();//this.readVarint(true);
		if (count-- > 1) {
			if (count >= maxLength) {
				debugger;
				count = maxLength - 1;
			}
			let bytes = new Uint8Array(count);
			for (let i = 0; i < count; i++) {
				bytes[i] = this.readByte();
			}
			bytes[count] = "\0";
			return utf8decoder.decode(bytes);
		}
		//return null;
	}
	
	get color () {
		let value = [];
		let rgba = this.int;
		value[0] = ((rgba & 0xff000000) >>> 24).toString(16).padStart(2, "0"); // R
		value[1] = ((rgba & 0x00ff0000) >>> 16).toString(16).padStart(2, "0"); // G
		value[2] = ((rgba & 0x0000ff00) >>> 8).toString(16).padStart(2, "0"); // B
		value[3] = ((rgba & 0x000000ff)).toString(16).padStart(2, "0"); // A
		return value;
	}
	readColor () {
		let value = [];
		let rgba = this.readInt();
		value[0] = ((rgba & 0xff000000) >>> 24).toString(16).padStart(2, "0"); // R
		value[1] = ((rgba & 0x00ff0000) >>> 16).toString(16).padStart(2, "0"); // G
		value[2] = ((rgba & 0x0000ff00) >>> 8).toString(16).padStart(2, "0"); // B
		value[3] = ((rgba & 0x000000ff)).toString(16).padStart(2, "0"); // A
		return value.join("");
	}
}

const AttachmentType = ["region", "boundingbox", "mesh", "skinnedmesh", "path", "point", "clipping"];
const CurveType = ["linear", "stepped", "bezier"];
const TimelineType = ["scale", "rotate", "translate", "attachment", "color", "flipX", "flipY"];

class SpineBinaryReader {
	constructor() {
		this.scale = 1;
		
		this.skeleton = {};
		this.bones = [];
		this.ik = [];
		this.slots = [];
		this.skins = {};
		this.events = [];
		this.animations = {};
		
		this._skinArray = [];
		
		this.$err = true;
		this.$d = true;
		this.$v = 3;
	}
	
	export() {
		let obj = Object.assign({}, {//clone
			skeleton: this.skeleton,
			bones: this.bones,
			slots: this.slots,
			ik: this.ik,
			//transform: [],
			//path: [],
			skins: this.skins,
			//events: this.events,
			animations: this.animations,
		});
		obj.skeleton.spine = "3.1.05";
		obj.skeleton.images = "./";
		if (obj.skins) {
			for (let i in obj.skins.default)
				for (let j in obj.skins.default[i])
					if (obj.skins.default[i][j].type == "_mesh")
						delete obj.skins.default[i][j];
		}
		let json = JSON.stringify(obj, null, "\t");
		DownloadData(json, null, "lusi.json");
	}
	
	fromBuffer(arrayBuffer) {
		this.input = new BinaryReader(arrayBuffer);
		this.readSkeleton();
		this.readBones();
		this.readIKs();
		this.readSlots();
		this.readSkins();
		this.readEvent();
		this.readAnimations();
		
		if (this.input._c == this.input._b.length) {
			console.log("read file end");
		}
		else {
			console.log("file format ??");
		}
		
		for (let i in this.skins.default)
			for (let j in this.skins.default[i])
				if (this.skins.default[i][j].type == "_mesh")
					delete this.skins.default[i][j];
		return {
			skeleton: this.skeleton,
			bones: this.bones,
			ik: this.ik,
			slots: this.slots,
			skins: this.skins,
			events: this.events,
			animations: this.animations,
		}
	}
	
	_getBone(index) {
		if (index >= 0 && index < this.bones.length) {
			return this.bones[index].name;
		}
		else {
			if (this.$err)
				throw new Error();
			if (this.$d)
				debugger;
			return "root";
		}
	}
	_getSlot(index) {
		if (index >= 0 && index < this.slots.length) {
			return this.slots[index].name;
		}
		else {
			if (this.$err)
				throw new Error();
			if (this.$d)
				debugger;
			return this.slots[index] ? this.slots[index].name:undefined;
		}
	}
	_getIKConstraint(index) {
		if (index >= 0 && index < this.ik.length) {
			return this.ik[index].name;
		}
		else {
			if (this.$err)
				throw new Error();
			if (this.$d)
				debugger;
			return this.ik[index] ? this.ik[index].name:undefined;
		}
	}
	_getSkin(index) {
		if (index >= 0 && index < this._skinArray.length) {
			return this._skinArray[index].name;
		}
		else {
			if (this.$err)
				throw new Error();
			if (this.$d)
				debugger;
			return "default";
		}
	}
	
	readSkeleton() {
		let input = this.input;
		let scale = this.scale;
		
		this.skeleton.hash = input.readString();
		this.skeleton.spine = input.readString();
		this.skeleton.width = input.readFloat();
		this.skeleton.height = input.readFloat();
		
		this.nonessential = input.readBoolean();
		
		if (this._nonessential) {
			this.skeleton.images = input.readString();
		}
		
		console.log("spine version: " + this.skeleton.spine);
	}
	
	readBones() {
		let input = this.input;
		let scale = this.scale, nonessential;
		
		let count = input.readVarint(true);
		this.bones = new Array(count);
		
		for (let i = 0; i < count; ++i) {
			let bone = {};
			
			bone.name = input.readString();
			bone.parent = input.readVarint(true) - 1;
		
			bone.x = input.readFloat() * scale;
			bone.y = input.readFloat() * scale;
			bone.scaleX = input.readFloat();
			bone.scaleY = input.readFloat();
			bone.rotation = input.readFloat();
			bone.length = input.readFloat() * scale;
			if (this.$v == 2) {
				bone.flipX = input.readBoolean();//flipX//shearX//2.x
				bone.flipY = input.readBoolean();//flipY//shearY//2.x
				if (bone.flipX || bone.flipY) {
					console.group("bone: " + bone.name);
					console.log("flipX :" + bone.flipX);
					console.log("flipY :" + bone.flipY);
					console.groupEnd();
				}
			}
			else if (this.$v == 3) {
				bone.scaleX *= input.readBoolean() ? -1:1;//flipX//shearX//3.x
				bone.scaleY *= input.readBoolean() ? -1:1;//flipY//shearY//3.x
				//if (bone.shearX || bone.shearY) {
				//	console.group("bone: " + bone.name);
				//	console.log("shearX :" + bone.shearX);
				//	console.log("shearY :" + bone.shearY);
				//	console.groupEnd();
				//}
			}
			//if (bone.flipX) {
			//	bone.x *= -1;
			//}
			//if (bone.flipY) {
			//	bone.y *= -1;
			//}
			bone.inheritScale = input.readBoolean();
			bone.inheritRotation = input.readBoolean();
			
			if (this._nonessential) {
				bone.color = input.readColor();
			}
			
			this.bones[i] = bone;
		}
		for (let i = 0; i < count; ++i) {
			let bone = this.bones[i];
			if (bone.name != "root") {
				let parentIndex = bone.parent;
				let parentName = this._getBone(parentIndex);
				bone.parent = parentName;
				if (bone.name == bone.parent) {
					debugger;
					delete bone.parent;
				}
			}
			else {
				delete bone.parent;
			}
		}
		return this.bones;
	}
	
	// IK constraints.
	readIKs() {
		let input = this.input;
		let count = input.readVarint(true);
		for (let i = 0; i < count; ++i) {
			let ik = {};
			
			ik.name = input.readString();
			
			let boneCount = input.readVarint(true);
			ik.bones = new Array(boneCount);//bone index
			for (let j = 0; j < boneCount; ++j) {
				let boneName = this._getBone(input.readVarint(true));
				ik.bones[j] = boneName;
			}
			
			ik.target = this._getBone(input.readVarint(true));
			
			ik.mix = input.readFloat(true);
			if (this.$v == 3) {
				ik.order = 2;
				ik.bendPositive = input.readBoolean(true);
			}
			else if (this.$v == 2) {
				ik.bendDirection = input.readBoolean(true);
			}
			
			this.ik.push(ik);
		}
		return this.ik;
	}
	readSlots() {
		const BlendMode = ["normal", "additive", "multiply", "screen"];
		let input = this.input;
		let count = input.readVarint(true);
		for (let i = 0; i < count; ++i) {
			let slot = {};
			
			slot.name = input.readString();
			slot.bone = this._getBone(input.readVarint(true));
			slot.color = input.readColor();
			let attachment = input.readString();
			if (attachment) {
				slot.attachment = attachment;
			}
			if (this.$v == 3) {
				let additive  = input.readBoolean();
				slot.blend = additive ? "additive":"normal";
				if (additive) {
					debugger;
				}
			}
			else if (this.$v == 2) {
				slot.additive = input.readBoolean();
			}
			
			this.slots.push(slot);
		}
		return this.slots;
	}
	
	_readFloatArray(scale) {
		let input = this.input;
		let n = input.readVarint(true);
		let array = new Array(n);
		if (scale == 1) {
			for (let i = 0; i < n; i++) {
				array[i] = input.readFloat();
			}
		} else {
			for (let i = 0; i < n; i++) {
				array[i] = input.readFloat() * scale;
			}
		}
		return array;
	}
	_readShortArray() {
		let input = this.input;
		let n = input.readVarint(true);
		let array = new Array(n);
		for (let i = 0; i < n; i++)
			array[i] = input.readShort();
		return array;
	}
	_readIntArray() {
		let input = this.input;
		let n = input.readVarint(true);
		let array = new Array(n);
		for (let i = 0; i < n; i++) {
			array[i] = input.readVarint(true);
		}
		return array;
	}
	_readAttachment(skin, attachmentName) {
		let input = this.input;
		let scale = this.scale;

		let name = input.readString();
		if (name == null) {
			name = attachmentName;
		}

		let a_type = AttachmentType[input.readByte()];
		switch (a_type) {
		case "region": {
			let region = {};
			let path = input.readString();
			region.type = a_type;
			region.name = name;
			if (path) {
				region.path = input.readString();
			}
			region.x = input.readFloat() * scale;
			region.y = input.readFloat() * scale;
			region.scaleX = input.readFloat();
			region.scaleY = input.readFloat();
			region.rotation = input.readFloat();
			region.width = input.readFloat() * scale;
			region.height = input.readFloat() * scale;
			region.color = input.readColor();
			return region;
		}
		case "boundingbox": {
			let box = {};
			box.type = a_type;
			box.name = name;
			box.vertices = this._readFloatArray(scale);
			box.vertexCount = box.vertices.length / 2;
			return box;
		}
		case "mesh":
		case "skinnedmesh": {
			let mesh = {};
			let path = input.readString();
			mesh.type = a_type;//"_mesh";//
			mesh.name = name;
			if (path) {
				mesh.path = path;
			}
			mesh.uvs = this._readFloatArray(1);//float[]//see line: 260
			mesh.triangles = this._readShortArray();//short[]
			mesh.vertices = this._readFloatArray(scale);//float[]

			mesh.color = input.readColor();
			mesh.hull = input.readVarint(true);// * 2
			if (this.nonessential) {
				mesh.edges = this._readIntArray();
				mesh.width = input.readFloat() * scale;
				mesh.height = input.readFloat() * scale;
			}
			return mesh;
		}
		//case "skinnedmesh": {
		//	let mesh = {};
		//	let path = input.readString();
		//	mesh.type = "mesh";
		//	mesh.name = name;
		//	if (path) {
		//		mesh.path = path;
		//	}
		//	
		//	mesh.uvs = this._readFloatArray(1);
		//	let triangles = this._readShortArray();
		//
		//	let vertexCount = input.readVarint(true);
		//	//let weights = [];//new Array(uvs.length * 3 * 3);//float[]
		//	//let bones = [];//new Array(uvs.length * 3);//int[]
		//	let vertices = [];
		//	for (let i = 0; i < vertexCount; i++) {
		//		let boneCount = input.readFloat();
		//		//bones.push(boneCount);
		//		vertices[i] = boneCount;
		//		for (let nn = i + Math.trunc(boneCount) * 4; i < nn; i += 4) {
		//			//bones.push(input.readFloat());
		//			//weights.push(input.readFloat() * scale);
		//			//weights.push(input.readFloat() * scale);
		//			//weights.push(input.readFloat());
		//			vertices[i + 1] = input.readFloat();//bone index
		//			vertices[i + 2] = input.readFloat();//bind position X
		//			vertices[i + 3] = input.readFloat();//bind position Y
		//			vertices[i + 4] = input.readFloat();//weight
		//		}
		//	}
		//	
		//	//mesh.bones = bones;
		//	//mesh.weights = weights;
		//	mesh.vertices = vertices;
		//	
		//	//mesh.skin = skin;
		//	mesh.triangles = triangles;
		//	
		//	mesh.color = input.readColor();
		//	mesh.hull = input.readVarint(true);// * 2
		//	if (this.nonessential) {
		//		mesh.edges = this._readIntArray();
		//		mesh.width = input.readFloat() * scale;
		//		mesh.height = input.readFloat() * scale;
		//	}
		//	return mesh;
		//}
		}
		//return null;
	}
	_readSkin() {
		let input = this.input;
		let slotCount = input.readVarint(true);
		if (slotCount == 0 || slotCount > 65535) {
			debugger;
			//return null;
		}
		let skin = {};
		for (let i = 0; i < slotCount; i++) {
			let slot = {};
			let slotName = this._getSlot(input.readVarint(true));
			let attachmentCount = input.readVarint(true);
			for (let j = 0; j < attachmentCount; j++) {
				let attachmentName = input.readString();
				slot[attachmentName] = this._readAttachment(skin, attachmentName);
			}
			skin[slotName] = slot;
		}
		return skin;
	}
	readSkins() {
		let input = this.input;
		
		this.skins.default = this._readSkin();
		this._skinArray.push({
			name: "default",
			skin: this.skins.default
		});
		
		let count = input.readVarint(true);
		for (let i = 0; i < count; i++) {
			let name = input.readString();
			let skin = this._readSkin();
			this.skins[name] = skin;
			this._skinArray.push({
				name, skin
			});
		}
	}
	
	readEvent() {
		let input = this.input;
		let count = input.readVarint(true);
		this.events = new Array(count);
		for (let i = 0; i < count; i++) {
			let eventData = {};
			eventData.name = input.readString();
			eventData.int = input.readVarint(false);
			eventData.float = input.readFloat();
			eventData.string = input.readString();
			
			this.events[i] = eventData;
		}
	}
	
	_readCurve() {
		let input = this.input;
		let type = CurveType[input.readByte()];
		let ret;
		switch (type) {
		case "bezier":
			ret = [input.readFloat(), input.readFloat(), input.readFloat(), input.readFloat()];
		default:
			ret = type || "linear";//smooth step
		}
		//return [0.5, -1, 0.5, 2];
		//if (type = "bezier") {
			return ret;
		//}
		//else {
		//	return [0.25, 0.75, 1, 1];//ret;//
		//	return [0.5, 0, 1, 1];//ret;//
		//}
	}
	_readAnimation() {
		let input = this.input;
		let scale  = 1;
		let anim = {
			bones: {},
			slots: {},
			ik: {},
			ffd: {},//deform
			events: [],
			draworder: [],
		};
		
		// Slot timelines.
		for (let i = 0, n = input.readVarint(true); i < n; i++) {
			let slotName = this._getSlot(input.readVarint(true));
			let slotAnim = anim.slots[slotName] = {};
			for (let ii = 0, nn = input.readVarint(true); ii < nn; ii++) {
				let timelineType = TimelineType[input.readByte()];
				let frameCount = input.readVarint(true);
				switch (timelineType) {
				case "color": {
					let slotColorAnim = slotAnim.color = [];
					
					for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
						let frame = {};
						frame.time = input.readFloat();
						frame.color = input.readColor();
						if (frameIndex < frameCount - 1) {
							frame.curve = this._readCurve(frameIndex);
						}
						slotColorAnim.push(frame);
					}
					if (!slotAnim.color.length) {
						delete slotAnim.color;
					}
					break;
				}
				case "attachment":
					let attaColorAnim = slotAnim.attachment = [];
					for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
						let frame = {};
						frame.time = input.readFloat();
						frame.name = input.readString();
						attaColorAnim.push(frame);
					}
					if (!slotAnim.attachment.length) {
						delete slotAnim.attachment;
					}
					break;
				}
			}
		}
		
		// Bone timelines.
		for (let i = 0, n = input.readVarint(true); i < n; i++) {
			let boneName = this._getBone(input.readVarint(true));
			let boneAnim = anim.bones[boneName] = {};
			for (let ii = 0, nn = input.readVarint(true); ii < nn; ii++) {
				let timelineType = TimelineType[input.readByte()];
				let frameCount = input.readVarint(true);
				switch (timelineType) {
				case "rotate": {
					let boneRotateAnim = boneAnim.rotate = [];
					for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
						let frame = {}
						frame.time = input.readFloat();
						frame.angle = input.readFloat();
						if (frameIndex < frameCount - 1) {
							frame.curve = this._readCurve();
						}
						boneRotateAnim.push(frame);
					}
					if (!boneAnim.rotate.length) {
						delete boneAnim.rotate;
					}
					break;
				}
				case "translate":
				case "scale": {
					let timelineScale = 1;
					if (timelineType == "translate") {
						timelineScale = scale;
					}
					let boneTfAnim = boneAnim[timelineType] = [];
					for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
						let frame = {};
						frame.time = input.readFloat();
						frame.x = input.readFloat() * timelineScale;
						frame.y = input.readFloat() * timelineScale;
						if (frameIndex < frameCount - 1) {
							frame.curve = this._readCurve();
						}
						boneTfAnim.push(frame);
					}
					if (!boneAnim[timelineType].length) {
						delete boneAnim[timelineType];
					}
					break;
				}
				case "flipX": {
					if (this.$v == 3) {
						timelineType = "scale";
						let boneTfAnim = boneAnim[timelineType] = [];
						for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
							let frame = {};
							frame.time = input.readFloat();
							frame.x = input.readBoolean() ? -1:1;
							frame.y = 1;
							if (frameIndex < frameCount - 1) {
								frame.curve = this._readCurve();
							}
							boneTfAnim.push(frame);
							//console.log("boneAnim flipX: " + boneName);
						}
						if (!boneAnim[timelineType].length) {
							delete boneAnim[timelineType];
						}
					}
					else {
						throw new Error("x");
					}
				}
				case "flipY": {
					if (this.$v == 3) {
						timelineType = "scale";
						let boneTfAnim = boneAnim[timelineType] = [];
						for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
							let frame = {};
							frame.time = input.readFloat();
							frame.x = 1;
							frame.y = input.readBoolean() ? -1:1;
							if (frameIndex < frameCount - 1) {
								frame.curve = this._readCurve();
							}
							boneTfAnim.push(frame);
							//console.log("boneAnim flipY: " + boneName);
						}
						if (!boneAnim[timelineType].length) {
							delete boneAnim[timelineType];
						}
					}
					else {
						throw new Error("y");
					}
				}
				}
			}
		}

		// IK timelines.
		for (let i = 0, n = input.readVarint(true); i < n; i++) {
			let constraintName = this._getIKConstraint(input.readVarint(true));
			let ikAnim = anim.ik[constraintName] = [];
			
			let frameCount = input.readVarint(true);
			for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
				let frame = {};
				frame.time = input.readFloat()
				frame.mix = input.readFloat();
				frame.bendPositive = input.readBoolean();
				if (frameIndex < frameCount - 1) {
					frame.curve = this._readCurve();
				}
				ikAnim.push(frame);
			}
			if (!anim.ik[constraintName].length) {
				delete anim.ik[constraintName];
			}
		}
		if (!Object.keys(anim.ik).length) {
			delete anim.ik;
		}

		// FFD timelines.
		for (let i = 0, n = input.readVarint(true); i < n; i++) {
			let skinName = this._getSkin(input.readVarint(true));
			let skinAnim = anim.ffd[skinName] = [];
			
			for (let ii = 0, nn = input.readVarint(true); ii < nn; ii++) {
				let slotName = this._getSlot(input.readVarint(true));
				let skinSlotAnim = skinAnim[slotName] = {};
				
				for (let iii = 0, nnn = input.readVarint(true); iii < nnn; iii++) {
					let meshName = input.readString();
					let frameCount = input.readVarint(true);
					let skinSlotMeshAnim = skinSlotAnim[meshName] = [];//{}
					
					for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
						let frame = {};
						
						frame.time = input.readFloat();

						let end = input.readVarint(true);
						if (end != 0) {
							let vertices = [];
							let start = frame.offset = input.readVarint(true);
							end += start;
							for (let v = start; v < end; v++) {
								vertices[v] = input.readFloat() * this.scale;
							}
							frame.vertices = vertices;
						}

						if (frameIndex < frameCount - 1) {
							frame.curve = this._readCurve();
						}
						
						skinSlotMeshAnim.push(frame);
					}
					if (!skinSlotAnim[meshName].length) {
						delete skinSlotAnim[meshName];
					}
				}
				skinAnim.push(skinSlotAnim);
			}
			if (!anim.ffd[skinName].length) {
				delete anim.ffd[skinName];
			}
		}
		if (!Object.keys(anim.ffd).length) {
			delete anim.ffd;
		}

		// Draw order timeline.
		let drawOrderCount = input.readVarint(true);
		if (drawOrderCount > 0) {
			for (let i = 0; i < drawOrderCount; i++) {
				let frame = {};
				let offsetCount = input.readVarint(true);
				
				let offsets = new Array(offsetCount);
				for (let ii = 0; ii < offsetCount; ii++) {
					let slotName = this._getSlot(input.readVarint(true));
					let offset = input.readVarint(true)
					offsets[ii] = {
						slot: slotName,
						offset: offset
					};
				}
				if (offsets.length) {
					frame.offsets = offsets;
				}
				frame.time = input.readFloat();
				
				anim.draworder.push(frame);
			}
		}
		else {
			delete anim.draworder;
		}

		// Event timeline.
		let eventCount = input.readVarint(true);
		if (eventCount > 0) {
			debugger;
			alert("not implement");
			for (let i = 0; i < eventCount; i++) {
				let frame = {};
				
				frame.time = input.readFloat();
				frame.name = input.readVarint(true);//eventName
				
				frame.int = input.readVarint(false);
				frame.float = input.readFloat();
				if (input.readBoolean()) {
					frame.string = input.readString();
				}
				anim.events.push(frame);
			}
		}
		else {
			delete anim.events;
		}
		
		return anim;
	}
	
	readAnimations() {
		let input = this.input;
		let count = input.readVarint(true);
		for (let i = 0; i < count; i++) {
			let name = input.readString();
			this.animations[name] = this._readAnimation();
		}
	}
}

// getBinaryFile("/binary/Map/Effect3/BossLucid/Lucid/lusi").then(a=>{
	// window._a = a;
	// window.aaa = new SpineBinaryReader().fromBuffer(window._a);
// });//SpineBinaryReader

function getBinaryFile(url) {
	return new Promise(function (resolve, reject) {
		let oReq = new XMLHttpRequest();
		oReq.open("GET", url, true);
		oReq.responseType = "arraybuffer";

		oReq.onload = function (oEvent) {
			let arrayBuffer = oReq.response; // Note: not oReq.responseText
			if (arrayBuffer) {
				resolve(arrayBuffer);
				//var byteArray = new Uint8Array(arrayBuffer);
				//for (var i = 0; i < byteArray.byteLength; i++) {
				//	// do something with each byte in the array
				//}
			}
			else {
				reject();
			}
		};
		oReq.onerror = function() {
			reject();
		};
		oReq.onabort = function() {
			reject();
		};

		oReq.send(null);
	});
}

