
<template>
	<div class="UIToolTip">
		<template v-if="chara != null && stat != null && equip != null">
			<div v-if="isShow" class="UIToolTip frame" style="/*height: 658px;*/">
				<table style="position:absolute; left:0px; top:0px; width:100%; height:100%;">
					<thead>
						<tr>
							<td colspan="3" class="UIToolTip border-head"></td>
						</tr>
					</thead>
					<tbody style="height: auto;">
						<tr>
							<td class="UIToolTip border-left"></td>
							<td class="UIToolTip container"></td>
							<td class="UIToolTip border-right"></td>
						</tr>
					</tbody>
					<tfoot>
						<tr>
							<td colspan="3" class="UIToolTip border-foot"></td>
						</tr>
					</tfoot>
				</table>
				<!--...-->
				<div class="custom-fixed">
					<div class="UIToolTip Item-Frame-cover"></div>
				</div>
				<!--...-->
				<div class="UIToolTip content">
					<!--border-head-->
					<div class="c1" style="position: relative; width: 100%; height: 13px;"></div>

					<div v-if="equip.max_start <= 15">
						<!--begin-star-->
						<div class="c2" style="position: relative; width: 100%; height: 10px;"></div>
						<div class="c3" style="position: relative; width: 100%; height: 8px;"></div>
						<!--end-star-->
					</div>

					<div v-if="equip.max_start > 15">
						<!--begin-star-->
						<div class="c1" style="position: relative; width: 100%; height: 10px;"></div>
						<div class="c2" style="position: relative; width: 100%; height: 7px;"></div>
						<!--end-star-->
					</div>

					<!--equip-name-->
					<div class="c3 UIToolTip title" style="z-index: 2; position: relative; width: 100%; height: 22px; text-align: center; text-shadow: 1px 1px 0 black, 0 0 1px white;">
						<span :style="equip.$foreign?'color: red':''">{{equip.name}}</span>
					</div>

					<!--begin-text-seg-->
					<div>
						<div class="c2" style="position: relative; width: 100%; height: 2px; font-size: 12px; text-align: center;"></div>

						<!--淺在-Level-->
						<div v-if="hasPotential()">
							<div class="c1" style="position: relative; width: 100%; height: 16px; text-align: center;">(稀有道具)</div>
						</div>

						<!--無法交換-->
						<div v-if="equip['無法交換']">
							<div class="c2" style="position: relative; width: 100%; height: 16px; font-size: 12px; text-align: center;">無法交換</div>
						</div>
					</div>
					<!--end-text-seg-->
					<!--begin-dotline-->
					<div class="c3" style="position: relative; width: 100%; height: 8px;"></div>
					<div class="c2 UIToolTip dotline" style="position: relative; width: 100%; height: 2px;"></div>
					<div class="c1" style="position: relative; width: 100%; height: 6px;"></div>
					<!--end-dotline-->

					<div class="c2" style="position: relative; width: 100%; height: 85px;">
						<div style="float: left; position: relative; width: 12px; height: 100%;"></div>
						<div style="float: left; position: relative; width: 83px; height: 100%;">
							<texture style="position: absolute; top: 2px;" src="images/UI/UIToolTip.img/Item/ItemIcon/base"></texture>
							<div v-if="hasPotential()">
								<!--淺在-Level-->
								<texture style="position: absolute; left: 2px; top: 4px;" :src="`images/UI/UIToolTip.img/Item/ItemIcon/${equip.potential_level}`"></texture>
							</div>
							<img v-if="'icon' in equip" :src="equip.icon['']" @load="onload_icon($event)" class="UIToolTip equip-icon"></img>
							<texture style="position: absolute; left: 8px; top: 10px;" src="images/UI/UIToolTip.img/Item/ItemIcon/cover"></texture>
						</div>
						<div style="float: left; position: relative; top: 1px; width: 160px; height: 100%;">
							<div class="c1" style="position: relative; width: 155px; height: 50px;">
								<div style="position: relative; float: right;">攻擊力增加量</div>
								<div class="UIToolTip attack-digit" style="clear: right;">
									<texture src="images/UI/UIToolTip.img/Item/Equip/Summary/incline/0"></texture>
								</div>
							</div>
							<div class="UIToolTip attrLeft" style="float: left; width: 50%;">
								<equip-req-level attr-name="Level" :equip="equip" :stat="stat"></equip-req-level>

								<!--padding--><div class="c1" style="position: relative; width: 100%; height: 9px; margin-left: 2px;"></div>
								<equip-req attr-name="STR" :equip="equip" :stat="stat"></equip-req>

								<!--padding--><div class="c1" style="position: relative; width: 100%; height: 3px; margin-left: 2px;"></div>
								<equip-req attr-name="DEX" :equip="equip" :stat="stat"></equip-req>
							</div>
							<div class="UIToolTip attrRight" style="float: left; width: 50%;">
								<!--padding--><div class="c1" style="position: relative; width: 100%; height: 15px; margin-left: 2px;"></div>
								<equip-req attr-name="LUK" :equip="equip" :stat="stat"></equip-req>

								<!--padding--><div class="c1" style="position: relative; width: 100%; height: 3px; margin-left: 2px;"></div>
								<equip-req attr-name="INT" :equip="equip" :stat="stat"></equip-req>
							</div>
						</div>
					</div>

					<!---->
					<div class="c3" style="position: relative; width: 100%; height: 20px;"></div>

					<!--Job-info-->
					<div class="c1 UIToolTip req-job" style="position: relative; width: 100%; height: 30px;">
						<div style="position: relative; left: 13px;">
							<texture src="images/UI/UIToolTip.img/Item/Equip/Job/normal"></texture>
							<texture v-if="equip.reqJob < 0" :src="`images/UI/UIToolTip.img/Item/Equip/Job/enable/0`" origin="-"></texture>
							<div v-else-if="equip.reqJob == 0 || equip.reqJob == null">
								<texture src="images/UI/UIToolTip.img/Item/Equip/Job/enable/0" origin="-"></texture>
								<texture src="images/UI/UIToolTip.img/Item/Equip/Job/enable/1" origin="-"></texture>
								<texture src="images/UI/UIToolTip.img/Item/Equip/Job/enable/2" origin="-"></texture>
								<texture src="images/UI/UIToolTip.img/Item/Equip/Job/enable/3" origin="-"></texture>
								<texture src="images/UI/UIToolTip.img/Item/Equip/Job/enable/4" origin="-"></texture>
								<texture src="images/UI/UIToolTip.img/Item/Equip/Job/enable/5" origin="-"></texture>
							</div>
							<div v-else>
								<texture v-if="equip.reqJob &  1" :src="`images/UI/UIToolTip.img/Item/Equip/Job/${(canUseEquip() ? 'enable' : 'disable')}/1`" origin="-"></texture>
								<texture v-if="equip.reqJob &  2" :src="`images/UI/UIToolTip.img/Item/Equip/Job/${(canUseEquip() ? 'enable' : 'disable')}/2`" origin="-"></texture>
								<texture v-if="equip.reqJob &  4" :src="`images/UI/UIToolTip.img/Item/Equip/Job/${(canUseEquip() ? 'enable' : 'disable')}/3`" origin="-"></texture>
								<texture v-if="equip.reqJob &  8" :src="`images/UI/UIToolTip.img/Item/Equip/Job/${(canUseEquip() ? 'enable' : 'disable')}/4`" origin="-"></texture>
								<texture v-if="equip.reqJob & 16" :src="`images/UI/UIToolTip.img/Item/Equip/Job/${(canUseEquip() ? 'enable' : 'disable')}/5`" origin="-"></texture>
							</div>
						</div>
						<div v-if="'reqSpecJob' in equip">
							<!--<div :if="equip.reqSpecJob != null && stat._spec_job == equip.reqSpecJob"></div>-->
						</div>
					</div>

					<!--begin-dotline-->
					<div class="c2" style="position: relative; width: 100%; height: 4px;"></div>
					<div class="c1 UIToolTip dotline" style="position: relative; width: 100%; height: 2px;"></div>
					<div class="c3" style="position: relative; width: 100%; height: 5px;"></div>
					<!--end-dotline-->
					<!--begin-text-seg-->
					<div class="UIToolTip attribute">
						<div v-if='isEquip(equip.id)'>
							<div class="c1"><span>裝備分類 : {{getEquipCategoryName()}}</span></div>
						</div>

						<div class="c2" v-if="shouldShowAttr('incSTR')">	  	<span>力量 :	  	   {{adjAttr(equip.incSTR)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incSTRr')">	  	<span>力量 :		   {{adjAttr(equip.incSTRr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incDEX')">	  	<span>敏捷 :		   {{adjAttr(equip.incDEX)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incDEXr')">	    <span>敏捷 :		   {{adjAttr(equip.incDEXr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incINT')">	  	<span>智力 :		   {{adjAttr(equip.incINT)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incINTr')">	  	<span>智力 :		   {{adjAttr(equip.incINTr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incLUK')">	  	<span>幸運 :		   {{adjAttr(equip.incLUK)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incLUKr')">	  	<span>幸運 :		   {{adjAttr(equip.incLUKr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incAllStat')">	<span>所有属性 :	   {{adjAttr(equip.incAllStat)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incMHP')">	  	<span>MaxHP :	  	   {{adjAttr(equip.incMHP)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incMHPr')">	  	<span>MaxHP :		   {{adjAttr(equip.incMHPr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incMMP')">	  	<span>MaxMP :	  	   {{adjAttr(equip.incMMP)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incMMPr')">	  	<span>MaxMP :		   {{adjAttr(equip.incMMPr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incMDF')">	  	<span>MaxDF :		   {{adjAttr(equip.incMDF)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incPAD')">	  	<span>攻擊力 :		   {{adjAttr(equip.incPAD)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incPADr')">	  	<span>攻擊力 :		   {{adjAttr(equip.incPADr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incMAD')">	  	<span>魔法力 :		   {{adjAttr(equip.incMAD)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incMADr')">	  	<span>魔法力 :		   {{adjAttr(equip.incMADr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incPDD')">	  	<span>物理防禦力 :     {{adjAttr(equip.incPDD)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incPDDr')">	  	<span>物理防禦力 :     {{adjAttr(equip.incPDDr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incMDD')">	  	<span>魔法防禦力 :     {{adjAttr(equip.incMDD)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incMDDr')">	  	<span>魔法防禦力 :     {{adjAttr(equip.incMDDr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incACC')">	  	<span>命中值 :		   {{adjAttr(equip.incACC)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incACCr')"> 		<span>命中值 :		   {{adjAttr(equip.incACCr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incEVA')">	  	<span>回避值 :		   {{adjAttr(equip.incEVA)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incEVAr')">	  	<span>回避值 :		   {{adjAttr(equip.incEVAr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incSpeed')">  	<span>移动速度 :		   {{adjAttr(equip.incSpeed)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incJump')">		<span>跳跃力 :		   {{adjAttr(equip.incJump)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incCraft')">		<span>手技 :		   {{adjAttr(equip.incCraft)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('damR')">		    <span>总伤害 :  		   {{adjAttr(equip.damR)}}</span></div>
						<div class="c3" v-if="shouldShowAttr('incDAMr')">		<span>总伤害 :	  	   {{adjAttr(equip.incDAMr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incCr')">			<span>爆击率 :		   {{adjAttr(equip.incCr)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incPVPDamage')">	<span>大乱斗时追加攻击力{{adjAttr(equip.incPVPDamage)}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incPQEXPr')">		<span>组队任务经验值增加{{equip.incPQEXPr}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incBDR')">		<span>攻击BOSS怪物时，伤害+{{equip.incBDR}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('bdR')">			<span>攻击BOSS怪物时，伤害+{{equip.bdR}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('incIMDR')">		<span>無視怪物防禦力{{equip.incIMDR}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('imdR')">			<span>無視怪物防禦力{{equip.imdR}}%</span></div>
						<div class="c3" v-if="shouldShowAttr('limitBreak')">	<span>伤害上限突破至{{equip.limitBreak}}。</span></div>
						<div class="c3" v-if="shouldShowAttr('reduceReq')">		<span>装备等级降低 : -{{equip.reduceReq}}。</span></div>
						<div class="c3" v-if="shouldShowAttr('knockback')">		<span>直接攻击时{{equip.knockback}}的比率发生后退现象。</span></div>
						<div class="c1" v-if="shouldShowAttr('tuc')">			<span>可使用捲軸次數 : {{equip.tuc}}</span></div>

						<!--
						case GearPropType.only: return value == 0 ? null : "固有道具";
						case GearPropType.tradeBlock: return value == 0 ? null : "不可交换";
						case GearPropType.equipTradeBlock: return value == 0 ? null : "装备后无法交换";
						case GearPropType.accountSharable: return value == 0 ? null : "世界内只有我的角色之间可以移动";
						case GearPropType.onlyEquip: return value == 0 ? null : "固有装备物品";
						case GearPropType.notExtend: return value == 0 ? null : "无法延长有效时间。";
						case GearPropType.tradeAvailable:
							switch (value)
							{
								case 1: return " #c使用宿命剪刀，可以使物品交易1次。#";
								case 2: return " #c使用白金宿命剪刀，可以使物品交易1次。#";
								default: return null;
							}
						case GearPropType.accountShareTag:
							switch (value)
							{
								case 1: return " #c使用物品共享牌，可以在同一账号内的角色间移动1次。#";
								default: return null;
							}
						case GearPropType.noPotential: return value == 0 ? null : "无法设置潜能。";
						case GearPropType.fixedPotential: return value == 0 ? null : "无法重设潜能";
						case GearPropType.superiorEqp: return value == 0 ? null : "道具强化成功时，可以获得更高的效果。";
						case GearPropType.nActivatedSocket: return value == 0 ? null : "#c可以镶嵌星岩#";
						case GearPropType.jokerToSetItem: return value == 0 ? null : " #c当前装备3个以上的所有套装道具中包含的幸运物品！#";
						case GearPropType.abilityTimeLimited: return value == 0 ? null : "限期能力值";
						case GearPropType.blockGoldHammer: return value == 0 ? null : "无法使用黄金锤";

						case GearPropType.incMHP_incMMP: return "最大HP/最大MP：" + sign + value;
						case GearPropType.incMHPr_incMMPr: return "最大HP/最大MP：" + sign + value + "%";
						case GearPropType.incPAD_incMAD: return "攻击力/魔力：" + sign + value;
						case GearPropType.incPDD_incMDD: return "物理/魔法防御力：" + sign + value;
						case GearPropType.incACC_incEVA: return "命中值/回避值：" + sign + value;

						case GearPropType.incARC: return "ARC : " + sign + value;
					-->

					</div>
					<!--end-text-seg-->
					<!--padding_end-->
					<div class="c3" style="position: relative; width: 100%; height: 9px;"></div>

					<!--淺在_begin-->
					<div v-if="hasPotential()">
						<!--dotline-->
						<div class="c2 UIToolTip dotline" style="position: relative; width: 100%; height: 2px;"></div>

						<!--淺在icon-->
						<div class="c3" style="position: relative; width: 100%; height: 22px;"></div>

						<!--begin-淺在3x-->
						<div class="UIToolTip attribute" style="height: 48px; font-size: 11px;">
							<div class="c1" style="position: relative; width: 100%; height: 33%;">DEX&ensp;:&ensp;+6%</div>
							<div class="c2" style="position: relative; width: 100%; height: 33%;">STR&ensp;:&ensp;+3%</div>
							<div class="c3" style="position: relative; width: 100%; height: 33%;">DEX&ensp;:&ensp;+12</div>
						</div>
						<!--end-淺在3x-->
					</div>
					<!--淺在_end-->

					<div v-if="equip.desc">
						<!--begin-dotline-->
						<div class="c2 UIToolTip dotline" style="position: relative; width: 100%; height: 2px;"></div>
						<div class="c1" style="position: relative; width: 100%; height: 5px;"></div>
						<!--end-dotline-->

						<div style="padding-left: 12px;">
							{{equip.desc}}
							<div class="c3" style="position: relative; width: 100%; height: 13px;"></div>
						</div>
					</div>

					<div v-if="!'剪刀'">
						<!--begin-dotline-->
						<!--<div class="c1" style="position: relative; width: 100%; height: 3px;"></div>-->
						<div class="c2 UIToolTip dotline" style="position: relative; width: 100%; height: 2px;"></div>
						<div class="c3" style="position: relative; width: 100%; height: 3px;"></div>
						<!--end-dotline-->
						<!--begin-text-seg-->
						<div class="c1" style="position: relative; width: 100%; height: 16px;"></div>
						<div class="c2" style="position: relative; width: 100%; height: 16px;"></div>
						<!--end-text-seg-->
					</div>
				</div><!--content_end-->
			</div>
			<div v-if="isShowDebug" class="debug-info">
				<div contenteditable="true" spellcheck="false"><span>id   : </span>{{equip.id}}</div>
				<div v-if="!!equip._name" contenteditable="true" spellcheck="false"><span>nameEn: </span>{{equip._name}}</div>
				<div v-else contenteditable="true" spellcheck="false"><span>name : </span>{{equip.name}}</div>
				<div>Added in: {{equip.__v}}</div>
				<div contenteditable="true" spellcheck="false"><span>islot: </span>{{equip.islot}}</div>
				<div contenteditable="true" spellcheck="false"><span>vslot: </span>{{equip.vslot}}</div>
			</div>
		</template>
	</div>
</template>

<script>
	import { ItemCategoryInfo, ResourceManager, ItemAttrNormalize } from '../../../public/resource.js';

	import { CharacterStat } from "../../Common/PlayerData.js";


	const _init_data = {
		level: 150,
		str: 123, luk: 4,
		dex: 999, int: 4,
		_job: 3, _spec_job: 3,
	};

	const _init_equip_info = {
		"islot": "WpSi",
		"vslot": "WpSi",
		"walk": 1,
		"stand": 1,
		"attack": 5,
		"afterImage": "swordZL",
		"sfx": "swordZL",
		"attackSpeed": 6,
		"reqJob": 1,
		"reqLevel": 120,
		"reqSTR": 340,
		"reqDEX": 0,
		"reqINT": 0,
		"reqLUK": 0,
		"incPAD": 105,
		"tuc": 7,
		"price": 1,
		"cash": 0,
		"tradeBlock": 1,
		"notSale": 1,
		"reqSpecJob": 101,
		"unchangeable": 1,
		"name": "aa",
		"id": "00000000",
	};


	class CharaBaseJob {
		static baseJob(charaJob) {
			return Number((charaJob % 500).toString()[0]);
		}
	}
	//CharaJobInfo.pirate = 5;

	class EquipJobInfo {
		constructor(regexp, equip) {
		}
		static isUnlimited(job) {
			return job == 0;
		}
		static isBeginner(job) {
			return job == -1;
		}
		static isWarrior(job) {
			return job == 1;
		}
		static isMagician(job) {
			return job == 2;
		}
		static isBowman(job) {
			return job == 4;
		}
		static isThief(job) {
			return job == 8;
		}
		static isPirate(job) {
			return job == 16;
		}
		static canUseEquip(charaJob, equipJob) {
			let cj = 1 << (CharaBaseJob.baseJob(charaJob) - 1);

			if (equipJob > 0) {
				return cj && equipJob;
			}
			else if (equipJob == 0 || equipJob == null) {
				return true;//unlimited
			}
			else if (equipJob == -1) {
				consolw.error("Not implement beginner job");
				return true;
			}
			debugger;
		}
	}


	const Texture = {
		template: '<img v-data="src"></img>',
		props: {
			origin: {//operator // final position =  position operator.origin origin
				type: String,
				default: "",//+|-
				required: false
			},
			flip: {
				type: String,
				default: "",
				required: false
			},
			scale: {
				type: Array,
				default: null,
				required: false
			},
			src: {
				type: String,
				default: "",
				required: false
			}
		},
		directives: {
			'data': function (el, binding, vnode) {
				const src = binding.value;
				const vm = vnode.context;

				el.src = src;
			
				if (vm.scale) {
					(function (scale) {
						el.onload = function (e) {
							let width = e.target.naturalWidth * scale[0];
							let height = e.target.naturalHeight * scale[1];
							e.target.style.width = `${width}px`;
							e.target.style.height = `${height}px`;
						}
					})(vm.scale);
				}

				if (src.startsWith("/") || src.startsWith("http")) {
					(function (vm, img) {
						if (img.src.indexOf("maplestory.io") >= 0) {
							return;
						}
						let path = img.src.replace("images/", "/data/");
						$get(path).then(function (result) {
							try {
								let obj = JSON.parse(result);
								img.style.transform = "";
								if (vm.origin == "-") {
									img.style.transform = " scale(-1, -1)";
								}
								img.style.transform += ` translate3d(${obj.origin.x}px, ${obj.origin.y}px, ${(obj.z | 0)})`;
								if (vm.origin == "-") {
									img.style.transform += " scale(-1, -1)";
								}
							}
							catch (ex) {
								console.warn("path to JSON ?: " + path);
								console.warn("JSON ?: " + result);
								console.warn(ex);
							}
						});
					})(vm, el);
				}
			}
		}
	};

	class EquipReq {
		constructor() {
			this.components = {
				"texture": Texture,
			};

			this.props = ['attrName', 'equip', 'stat'];

			this.methods = {
				getReqState: this.getReqState,
				digitCharArray: this.digitCharArray,
				getReqAttrName: this.getReqAttrName,
			};
		
			this.render = function (createElement) {
				let state = this.getReqState();
				let digit = this.digitCharArray();
				let attrName = this.getReqAttrName();

				return createElement(
					"div",
					{
						class: { "c3": true, "UIToolTip ": true, "equip-req": true },
					}, [
						createElement("texture", {
							attrs: {
								src: `images/UI/UIToolTip.img/Item/Equip/${ EquipReq.prototype.getReqState.call(this)}/req${ attrName }`
							}
						}),
						createElement("div", {
							class: { "UIToolTip": true, "req-digit": true },
						}, [
							createElement("texture", {
								attrs: {
									src: `images/UI/UIToolTip.img/Item/Equip/${state}/${digit[0]}`
								}
							}),
							createElement("texture", {
								attrs: {
									src: `images/UI/UIToolTip.img/Item/Equip/${ state }/${ digit[1] }`
								}
							}),
							createElement("texture", {
								attrs: {
									src: `images/UI/UIToolTip.img/Item/Equip/${ state }/${ digit[2] }`
								}
							})
						])
					]
				)
			}
		}
		getReqAttrName() {
			return this.attrName.toUpperCase();
		}
		getReqState() {
			const required = this.equip[`req${this.attrName}`];
			const refer = this.stat[this.attrName.toLowerCase()];
			if (required != 0 && required != null && refer != null) {
				if (refer >= required) {
					return "Can";
				}
				else {
					return "Cannot";
				}
			}
			else {
				return "Disabled";
			}
		}
		digitCharArray() {
			const required = this.equip[`req${this.attrName}`] | 0;
			let s = Number(required).toFixed(0).padStart(3, "0");
			return s;
		}
		data() {
			return {
				imgUrl: "images/UI/UIToolTip.img/Item/Equip/"
			}
		}
	}

	class EquipReqLevel extends EquipReq {
		constructor() {
			super();
		}
		getReqAttrName() {
			return "LEV";
		}
		getReqState() {
			const required = this.equip[`req${this.attrName}`];
			const refer = this.stat[this.attrName.toLowerCase()];
			if (required != 0 && required != null && refer != null) {
				if (refer >= required) {
					return "YellowNumber";
				}
				else {
					return "Cannot";
				}
			}
			else {
				return "Disabled";
			}
		}
	}

	export default {
		props: {
			"equip": {
				required: false
			},
			"chara": {
				required: false
			},
			"state": {
				required: false
			},
			"isShow": {
				default: true
			},
			"isShowDebug": {
				default: true
			}
		},
		computed: {
			stat: {
				get: function () {
					if (this.chara && this.chara.stat) {
						return this.chara.stat;
					}
					else {
						return new CharacterStat();//dummy
					}
				},
				set: function () {
					this.$forceUpdate();
				}
			}
		},
		methods: {
			_update_frame: function () {
				let container = $(this.$el);
				let frame = container.children(".frame");//container.children(".UIToolTip").children(".frame");

				let height = frame.children(".content").height();

				frame.innerHeight(height);
			},
			canUseEquip: function () {
				return EquipJobInfo.canUseEquip(this.stat._job, this.equip.reqJob);
			},
			adjAttr: function (num) {
				return num > 0 ? ("+" + num) : num.toString();
			},
			getEquipCategoryName: function () {
				return ItemCategoryInfo.get(this.equip.id).categoryName;
			},
			hasPotential() {
				return false;
			},
			shouldShowAttr(attrName) {
				return this.equip[attrName] != null && this.equip[attrName] > 0;
			},
			isEquip(id) {
				return ItemCategoryInfo.isEquip(id);
			},
			onload_icon(event) {
				const img = event.target;
				img.style.width = (img.naturalWidth * 2) + "px";
				img.style.height = (img.naturalHeight * 2) + "px";
			},
		},
		updated: function () {
			this._update_frame();
		},
		mounted: function () {
			//debugger
			$(this.$el).draggable();
			this._update_frame();
		},
		watch: {
			"state.display": function (display) {
				if (display) {
					var $elem = $(this.$el).stop().show(/*"fade", {}, 120*/);
				}
				else {
					$(this.$el).hide(/*"fade", {}, 1000*/);
				}
			},
			"state.position": function (position) {
				if (this.state.display && position) {
					$(this.$el).position(position);
				}
			},
		},
		components: {
			"texture": Texture,
			"equip-req": new EquipReq(),
			"equip-req-level": new EquipReqLevel(),
		}
	};

</script>

<style>
	/*.c1 {
		background: rgba(255,0,128,0.5);
	}
	.c2 {
		background: rgba(128,255,0,0.5);
	}
	.c3 {
		background: rgba(0,128,255,0.5);
	}*/
	#UIToolTip {
		display: inline-block;
		z-index: 9999;
	}
	.UIToolTip {
		font-family: PMingLiU !important;
		font-size: 12px;
		color: #FFF;
	}
	.UIToolTip.frame {
		position: relative;
		width: 261px;
		/*height: 200px;*/
		display: inline-block;
	}
	.UIToolTip.frame table, .UIToolTip.frame thead, .UIToolTip.frame tbody, .UIToolTip.frame tfoot, .UIToolTip.frame tr, .UIToolTip.frame td {
		border-spacing: 0;
		border-collapse: collapse;
		margin: 0px;
		padding: 0px;
	}
	.UIToolTip.border-head {
		width: 261px;
		height: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame/top);
	}
	.UIToolTip.border-left {
		width: 13px;
		height: 3px;
		background-repeat: repeat-y;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/w);
	}
	.UIToolTip.container {
		width: 235px;
		height: auto;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/c);
	}
	.UIToolTip.border-right {
		width: 13px;
		height: 3px;
		background-repeat: repeat-y;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/e);
	}
	.UIToolTip.border-foot {
		width: 261px;
		height: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame/bottom);
	}
	.UIToolTip.Item-Frame-cover {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 100%;
		height: 100%;
		background: url(/images/UI/UIToolTip.img/Item/Frame/cover);
		background-repeat: no-repeat;
	}

	.UIToolTip.content {
		position: relative;
		left: 0;
		top: 0;
		width: 261px;
		/*height: 658px;*/
		/*background: url(/bg_UIToolTip.png);*/
	}
	.UIToolTip.title {
		font-weight: bold;
		font-size: 15px;
		letter-spacing: -0px;
	}
	.UIToolTip.dotline {
		background: url(/images/UI/UIToolTip.img/Item/Frame/dotline);
		background-repeat: no-repeat;
	}
	.UIToolTip.attack-digit {
		float: right;
		position: relative;
		top: 3px;
	}
	.UIToolTip.attack-digit > img {
		margin-left: -3px;
		margin-top: 1px;
	}
	.UIToolTip.attribute {
		margin-left: 12px;
		margin-right: 12px;
	}
	.UIToolTip.attribute > div {
		position: relative;
		width: 100%;
		height: 16px;
	}
	.UIToolTip.req-job img {
		position: absolute;
		left: 0px;
		top: 0px;
	}
	.UIToolTip.attrLeft .UIToolTip.req-digit {
		position: absolute;
		right: -1px;
		width: 20px;
		display: flex;
		flex-direction: row;
	}
	.UIToolTip.attrRight .UIToolTip.req-digit {
		position: absolute;
		right: 1px;
		width: 20px;
	}
	.UIToolTip.equip-req {
		position: relative;
		width: 100%;
		height: 6px;
		margin-left: 2px;
	}
	.UIToolTip.equip-req > img {
		position: absolute;
	}
	.UIToolTip.attrLeft .UIToolTip.req-digit > img {
		float: right;
		margin-left: 1px;
	}
	.UIToolTip.attrRight .UIToolTip.req-digit > img {
		float: left;
	}

	.UIToolTip.equip-icon {
		position: absolute;
		left: 0px;
		top: 0px;
		margin: auto;
		bottom: 0;
		right: 0;
	}

	.debug-info {
		position: absolute;
		top: 0;
		right: 0;
		transform: translateX(100%);
		display: inline-block;

		background: rgba(255,255,255,0.7) !important;
		color: black !important;

		border: double rgba(0,0,0,0.6);
		border-radius: 10px;
		padding: 0.5em 0.25em;

		/*
		font-size: 1.2em;
		text-shadow: rgb(255, 255, 255) 0 0 16px, rgb(255, 255, 255) 0 0 12px, rgb(255, 255, 255) 0 0 5px, rgb(255, 255, 255) 0 0 2px, rgba(0, 0, 0, 0.5) 0 0 1px;
		*/
		text-shadow: 0 0 1px rgba(255, 255, 255, 0.5);

		font-family: monospace;
	}

	.text-stroke {
		text-shadow: -1px -1px black, 0px -1px black, 1px -1px black, -1px 0px black, 1px 0px black, -1px 1px black, -1px 0px black, 1px 1px black, 0 0 1px black;
	}
</style>
