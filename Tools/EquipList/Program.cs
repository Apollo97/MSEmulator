
#if !EDGE_EQUIPLIST
using System;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using System.Text;
using System.Collections.Generic;
//using System.Data;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Dynamic;
using System.Diagnostics;
using System.Net;
using System.Web.Script.Serialization;
using System.Collections;
using System.Configuration;
#endif


namespace EquipList
{
	public class Program
	{
		[STAThread]
		static void Main(string[] args)
		{
			var setting = args.Length > 1 ? args[1] : "../../setting.ini";
			var extractTo = args.Length > 0 ? args[0] : "./equips";

			Program.main(setting, extractTo);
		}
		public static void main(string setting, string extractTo) {
			Startup.setting = setting;

			Console.WriteLine("setting: " + setting);
			Console.WriteLine("extract to: " + extractTo);
			Console.WriteLine("");

			DataSource.Init(setting);

			var data_extracter = new DataExtracter("");

			//var aaa = DataProvider.get_data_by_path("Map/Map/Map0/000000000");
			DataProvider.get_identities("Map/Obj/GachaponHousingTW");

			return;
			
			try
			{
				data_extracter.extractAll(extractTo);
			}
			catch(Exception ex)
			{
				Console.WriteLine("Error: ");
				Console.WriteLine(ex.Message);
				Console.WriteLine(ex.StackTrace);
			}
			Console.WriteLine("end");
		}
	}
}

public class Startup
{
	public static string setting = "";

	public async Task<object> Invoke(dynamic input)
	{
		EquipList.Program.main((string)input.setting, (string)input.extractTo);

		return null;
	}
}

internal class DataExtracter
{
	Inspector_Base64 inspet;
	wzproperty equip_names;
	wzpackage chara;

	int faceColor = 0;
	int hairColor = 0;

	int[] faceColorList = new int[] { 0, 1, 2, 3, 4, 5, 6, 7, 8 };
	int[] hairColorList = new int[] { 0, 1, 2, 3, 4, 5, 6, 7 };

	Dictionary<string, bool> extracts = new Dictionary<string, bool>();

	internal DataExtracter(string setting)
	{
		this.inspet = new Inspector_Base64();

		if (setting != "no_string")
		{
			this.chara = DataSource.packages["Character"];

			this.equip_names = DataSource.packages["String", "Eqp"].root[""]["Eqp"];
		}
	}

	internal void extractAll(string path)
	{
		this.output_file(path + "/body.json", this.extract_body);
		Console.WriteLine("extract body");

		this.output_file(path + "/head.json", this.extract_head);
		Console.WriteLine("extract head");

		for (int i = 0; i < this.faceColorList.Length; ++i)
		{
			this.faceColor = this.faceColorList[i];
			this.output_file(path + "/Face" + i + ".json", this.extract_face);
			Console.WriteLine("extract Face" + i);
		}

		for (int i = 0; i < this.hairColorList.Length; ++i)
		{
			this.hairColor = this.hairColorList[i];
			this.output_file(path + "/Hair" + i + ".json", this.extract_hair);
			Console.WriteLine("extract Hair" + i);
		}

		this.output_file(path + "/Cap.json", this.extract_equip, "Cap", "0100");
		Console.WriteLine("extract Cap");

		this.output_file(path + "/accessoryFace.json", this.extract_equip, "Accessory", "0101");
		Console.WriteLine("extract accessoryFace");

		this.output_file(path + "/accessoryEyes.json", this.extract_equip, "Accessory", "0102");
		Console.WriteLine("extract accessoryEyes");

		this.output_file(path + "/accessoryEars.json", this.extract_equip, "Accessory", "0103");
		Console.WriteLine("extract accessoryEars");


		this.output_file(path + "/Coat.json", this.extract_equip, "Coat", "0104");
		Console.WriteLine("extract Coat");

		this.output_file(path + "/Longcoat.json", this.extract_equip, "Longcoat", "0105");
		Console.WriteLine("extract Longcoat");

		this.output_file(path + "/Pants.json", this.extract_equip, "Pants", "0106");
		Console.WriteLine("extract Pants");

		this.output_file(path + "/Shoes.json", this.extract_equip, "Shoes", "0107");
		Console.WriteLine("extract Shoes");

		this.output_file(path + "/Glove.json", this.extract_equip, "Glove", "0108");
		Console.WriteLine("extract Glove");

		this.output_file(path + "/Shield.json", this.extract_equip, "Shield", "0109");
		Console.WriteLine("extract Shield");

		this.output_file(path + "/Cape.json", this.extract_equip, "Cape", "0110");
		Console.WriteLine("extract Cape");


		this.output_file(path + "/閃亮克魯.json", this.extract_equip, "Weapon", "0121");
		Console.WriteLine("extract 閃亮克魯");

		this.output_file(path + "/靈魂射手.json", this.extract_equip, "Weapon", "0122");
		Console.WriteLine("extract 靈魂射手");

		this.output_file(path + "/魔劍.json", this.extract_equip, "Weapon", "0123");
		Console.WriteLine("extract 魔劍");

		this.output_file(path + "/能量劍.json", this.extract_equip, "Weapon", "0124");
		Console.WriteLine("extract 能量劍");

		this.output_file(path + "/幻獸棒.json", this.extract_equip, "Weapon", "0125");
		Console.WriteLine("extract 幻獸棒");

		this.output_file(path + "/ESP限制器.json", this.extract_equip, "Weapon", "0126");
		Console.WriteLine("extract ESP限制器");

		this.output_file(path + "/鎖鏈.json", this.extract_equip, "Weapon", "0127");
		Console.WriteLine("extract 鎖鏈");

		this.output_file(path + "/魔力護腕.json", this.extract_equip, "Weapon", "0128");
		Console.WriteLine("extract 魔力護腕");

		this.output_file(path + "/單手劍.json", this.extract_equip, "Weapon", "0130");
		Console.WriteLine("extract 單手劍");

		this.output_file(path + "/單手斧.json", this.extract_equip, "Weapon", "0131");
		Console.WriteLine("extract 單手斧");

		this.output_file(path + "/單手錘.json", this.extract_equip, "Weapon", "0132");
		Console.WriteLine("extract 單手錘");

		this.output_file(path + "/短劍.json", this.extract_equip, "Weapon", "0133");
		Console.WriteLine("extract 短劍");

		this.output_file(path + "/雙刀.json", this.extract_equip, "Weapon", "0134");
		Console.WriteLine("extract 雙刀");

		this.output_file(path + "/靈魂之環.json", this.extract_equip, "Weapon", "013526");
		Console.WriteLine("extract 靈魂之環");

		this.output_file(path + "/控制器.json", this.extract_equip, "Weapon", "013530");
		Console.WriteLine("extract 控制器");

		this.output_file(path + "/手杖.json", this.extract_equip, "Weapon", "0136");
		Console.WriteLine("extract 手杖");

		this.output_file(path + "/短杖.json", this.extract_equip, "Weapon", "0137");
		Console.WriteLine("extract 短杖");

		this.output_file(path + "/長杖.json", this.extract_equip, "Weapon", "0138");
		Console.WriteLine("extract 長杖");

		this.output_file(path + "/雙手劍.json", this.extract_equip, "Weapon", "0140");
		Console.WriteLine("extract 雙手劍");

		this.output_file(path + "/雙手斧.json", this.extract_equip, "Weapon", "0141");
		Console.WriteLine("extract 雙手斧");

		this.output_file(path + "/雙手棍.json", this.extract_equip, "Weapon", "0142");
		Console.WriteLine("extract 雙手棍");

		this.output_file(path + "/槍.json", this.extract_equip, "Weapon", "0143");
		Console.WriteLine("extract 槍");

		this.output_file(path + "/矛.json", this.extract_equip, "Weapon", "0144");
		Console.WriteLine("extract 矛");

		this.output_file(path + "/弓.json", this.extract_equip, "Weapon", "0145");
		Console.WriteLine("extract 弓");

		this.output_file(path + "/弩.json", this.extract_equip, "Weapon", "0146");
		Console.WriteLine("extract 弩");

		this.output_file(path + "/拳套.json", this.extract_equip, "Weapon", "0147");
		Console.WriteLine("extract 拳套");

		this.output_file(path + "/指虎.json", this.extract_equip, "Weapon", "0148");
		Console.WriteLine("extract 指虎");

		this.output_file(path + "/火槍.json", this.extract_equip, "Weapon", "0149");
		Console.WriteLine("extract 火槍");

		this.output_file(path + "/鏟.json", this.extract_equip, "Weapon", "0150");
		Console.WriteLine("extract 鏟");

		this.output_file(path + "/鎬.json", this.extract_equip, "Weapon", "0151");
		Console.WriteLine("extract 鎬");

		this.output_file(path + "/雙弩槍.json", this.extract_equip, "Weapon", "0152");
		Console.WriteLine("extract 雙弩槍");

		this.output_file(path + "/加農砲.json", this.extract_equip, "Weapon", "0153");
		Console.WriteLine("extract 加農砲");

		this.output_file(path + "/太刀.json", this.extract_equip, "Weapon", "0154");
		Console.WriteLine("extract 太刀");

		this.output_file(path + "/扇子.json", this.extract_equip, "Weapon", "0155");
		Console.WriteLine("extract 扇子");

		this.output_file(path + "/琉.json", this.extract_equip, "Weapon", "0156");
		Console.WriteLine("extract 琉");

		this.output_file(path + "/璃.json", this.extract_equip, "Weapon", "0157");
		Console.WriteLine("extract 璃");

		this.output_file(path + "/重拳槍.json", this.extract_equip, "Weapon", "0158");
		Console.WriteLine("extract 重拳槍");

		this.output_file(path + "/0170.json", this.extract_cash_weapon, "Weapon", "0170");
	}

	Dictionary<string, dynamic> loadItemInfoFromJSON(string path)
	{
		var equipList = new Dictionary<string, dynamic>();

		if (File.Exists(path))
		{
			string text = System.IO.File.ReadAllText(path);
			var list = (dynamic[])JSON.parse(text);

			foreach (var item in list)
			{
				var obj = (dynamic)item;
				var id = obj.id;

				equipList[id] = obj;
			}
		}

		return equipList;
	}

	void output_file(string path, Func<Dictionary<string, dynamic>, dynamic> fnExtract)
	{
		Dictionary<string, dynamic> equipList = loadItemInfoFromJSON(path);

		dynamic eo = fnExtract(equipList);

		var str = JSON.stringify(eo);

		using (FileStream fs = new FileStream(path, FileMode.Create))
		using (StreamWriter ws = new StreamWriter(fs))
		{
			fs.Seek(0, SeekOrigin.Begin);

			ws.Write(str);
		}
	}

	void output_file(string path, Func<string, string, Dictionary<string, dynamic>, dynamic> fnExtract, string category, string id_prefix)
	{
		Dictionary<string, dynamic> equipList = loadItemInfoFromJSON(path);

		dynamic eo = fnExtract(category, id_prefix, equipList);

		var str = JSON.stringify(eo);

		using (FileStream fs = new FileStream(path, FileMode.Create))
		using (StreamWriter ws = new StreamWriter(fs))
		{
			fs.Seek(0, SeekOrigin.Begin);

			ws.Write(str);
		}
	}

	object extract_cash_weapon(string category, string id_prefix, Dictionary<string, dynamic> existItems)
	{
		var items = new ArrayList();

		IEnumerable<string> _identities =
			from identity in this.chara[category].identities
			where identity.StartsWith(id_prefix)
			select identity;

		SortedSet<string> new_identities = new SortedSet<string>(_identities, this.Comparer);
		var identities = new SortedSet<string>(new_identities);
		identities.UnionWith(existItems.Keys);

		foreach (var identity in identities)
		{
			var id32 = this.parse_id(identity);
			if (id32 < 0)
			{
				continue;
			}

			var name = this.get_equip_name(category, id32);
			var desc = this.get_equip_desc(category, id32);

			if (existItems.ContainsKey(identity))
			{
				bool modified = false;
				var data = existItems[identity];

				if (name != data.name)
				{
					data.name = name;
					modified = true;
				}
				if (desc != null && desc != data.desc)
				{
					data.desc = desc;
					modified = true;
				}
				if (modified || (new_identities.Contains(identity) && data.__v != DataSource.tag_version))
				{
					data.__modified = DataSource.tag_version;
				}
				items.Add(data);
			}
			else
			{
				var pack = this.chara[category][identity].root[""];
				var info = pack["info"];

				dynamic data = this.inspectProperty(info);
				data.id = identity;
				data.name = name;
				if (desc != null)
					data.desc = desc;
				//
				var __t = new List<string>(pack.identities);//點數武器可套用的武器類型
				__t.Remove("info");
				data.__t = String.Join(", ", __t.ToArray()); ;
				//
				data.icon = data.iconRaw;
				try
				{
					data.__hash = Tools._inspect_canvas1(info["iconRaw"])["_hash"] + "";
				}
				catch(Exception ex)
				{
					System.Console.WriteLine("get cashWpn(" + identity + ") icon._hash " + ex.Message);
				}
				data.__v = DataSource.tag_version;
				//
				var dict = (IDictionary<string, object>)data;
				dict.Remove("iconRaw");

				items.Add(data);
			}

#if MY_DEBUG
			break;
#endif
		}

		return items;
	}

	//icon = pack["stand1", "0", wear]
	//place => wear
	object extract_equip(string category, string id_prefix, Dictionary<string, dynamic> existItems)
	{
		var items = new ArrayList();

		IEnumerable<string> _identities =
			from identity in this.chara[category].identities
			where identity.StartsWith(id_prefix)
			select identity;

		SortedSet<string> new_identities = new SortedSet<string>(_identities);
		var identities = new SortedSet<string>(new_identities);
		identities.UnionWith(existItems.Keys);

		foreach (var identity in identities)
		{
			var id32 = this.parse_id(identity);
			if (id32 < 0)
			{
				continue;
			}

			var name = this.get_equip_name(category, id32);
			var desc = this.get_equip_desc(category, id32);

			if (existItems.ContainsKey(identity))
			{
				bool modified = false;
				var data = existItems[identity];

				if (name != data.name)
				{
					data.name = name;
					modified = true;
				}
				if (desc != null && desc != data.desc)
				{
					data.desc = desc;
					modified = true;
				}
				if (modified || (new_identities.Contains(identity) && data.__v != DataSource.tag_version))
				{
					data.__modified = DataSource.tag_version;
				}
				items.Add(data);
			}
			else
			{
				var pack = this.chara[category][identity].root[""];
				var info = pack["info"];

				dynamic data = this.inspectProperty(info);
				data.id = identity;
				data.name = name;
				if (desc != null)
					data.desc = desc;
				//
				try
				{
					data.__hash = data.icon._hash + "";
				}
				catch (Exception)
				{
				}
				data.__v = DataSource.tag_version;
				//
				var dict = (IDictionary<string, object>)data;
				dict.Remove("iconRaw");

				items.Add(data);
			}

#if MY_DEBUG
			break;
#endif
		}

		return items;
	}

	object extract_face(Dictionary<string, dynamic> existItems)
	{
		var items = new ArrayList();

		var new_identities = new SortedSet<string>();
		foreach (var i in this.chara["Face"].identities)
		{
			var style = this.get_colored_face_style(i, this.faceColor);

			if (style != null && !new_identities.Contains(style))
			{
				new_identities.Add(style);
			}
		}
		
		var identities = new SortedSet<string>(new_identities);
		identities.UnionWith(existItems.Keys);

		foreach (var identity in identities)
		{
			var id32 = this.parse_id(identity);
			if (id32 < 0)
			{
				continue;
			}

			var name = this.get_equip_name("Face", id32);

			if (existItems.ContainsKey(identity))
			{
				var data = existItems[identity];

				if (name != data.name || (new_identities.Contains(identity) && data.__v != DataSource.tag_version))
				{
					data.name = name;
					data.__modified = DataSource.tag_version;
				}
				items.Add(data);
			}
			else
			{
				var pack = this.chara["Face", identity].root[""];
				var info = pack["info"];
				var icon = pack["blink", "0", "face"];

				dynamic data = this.inspectProperty(info);
				data.id = identity;
				data.name = name;
				data.icon = this.inspectProperty(icon);
				try
				{
					data.__hash = (icon["_hash"] ?? pack["default", "face", "_hash"]).data;
				}
				catch(Exception ex)
				{
					System.Console.WriteLine("get face(" + identity + ") icon._hash " + ex.Message);
				}
				data.__v = DataSource.tag_version;

				items.Add(data);
			}
#if MY_DEBUG
			break;
#endif
		}

		return items;
	}

	object extract_hair(Dictionary<string, dynamic> existItems)
	{
		var items = new ArrayList();

		var new_identities = new SortedSet<string>();
		foreach (var i in this.chara["Hair"].identities)
		{
			var style = this.get_colored_hair_style(i, this.hairColor);
			if (style != null && !new_identities.Contains(style))
			{
				new_identities.Add(style);
			}
		}

		var identities = new SortedSet<string>(new_identities);
		identities.UnionWith(existItems.Keys);

		foreach (string identity in identities)
		{
			var id32 = this.parse_id(identity);
			if (id32 < 0)
			{
				continue;
			}

			var name = this.get_equip_name("Hair", id32);

			//#if MY_DEBUG
			//			string _identity = "00033426";//has no place: hair
			//#endif

			if (existItems.ContainsKey(identity))
			{
				var data = existItems[identity];

				if (name != data.name || (new_identities.Contains(identity) && data.__v != DataSource.tag_version))
				{
					data.name = name;
					data.__modified = DataSource.tag_version;
				}
				items.Add(data);
			}
			else
			{
				var pack = this.chara["Hair"][identity].root[""];
				var info = pack["info"];
				var icon = pack["stand1", "0", "hairOverHead"] ?? pack["stand1", "0", "hair"];

				dynamic data = this.inspectProperty(info);
				data.id = identity;
				data.name = name;
				data.icon = this.inspectProperty(icon);
				try
				{
					data.__hash = (icon["_hash"] ?? pack["default", "hairOverHead", "_hash"] ?? pack["default", "hair"]).data;
				}
				catch (Exception ex)
				{
					System.Console.WriteLine("get hair(" + identity + ") icon._hash " + ex.Message);
				}
				data.__v = DataSource.tag_version;

				items.Add(data);
			}
#if MY_DEBUG
			break;
#endif
		}

		return items;
	}

	object extract_head(Dictionary<string, dynamic> existItems)
	{
		var items = new ArrayList();

		IEnumerable<string> _heads =
			from identity in this.chara.identities
			where identity.StartsWith("0001")
			select identity;

		SortedSet<string> new_identities = new SortedSet<string>(_heads, this.Comparer);
		var identities = new SortedSet<string>(new_identities);
		identities.UnionWith(existItems.Keys);

		foreach (var identity in identities)
		{
			if (existItems.ContainsKey(identity))
			{
				var data = existItems[identity];
				if (identities.Contains(identity))
				{
					data.__modified = DataSource.tag_version;
				}
				items.Add(data);
			}
			else
			{
				var pack = this.chara[identity].root[""];
				var info = pack["info"];
				var icon = pack["stand1", "0", "head"];
				var name = "[" + identity + "]";

				dynamic data = this.inspectProperty(info);
				data.id = identity;
				data.name = name;
				data.icon = this.inspectProperty(icon);
				if (icon["_hash"] != null)
				{
					data.__hash = icon["_hash"].data + "";
				}
				data.__v = DataSource.tag_version;

				items.Add(data);
			}
#if MY_DEBUG
			break;
#endif
		}

		return items;
	}

	object extract_body(Dictionary<string, dynamic> existItems)
	{
		var items = new ArrayList();

		//pack://Character/00002001
		//info://Character/00002001/info
		//img://Character/00002001/stand1/0/body

		IEnumerable<string> _bodies =
			from identity in this.chara.identities
			where identity.StartsWith("0000")
			select identity;

		SortedSet<string> new_identities = new SortedSet<string>(_bodies, this.Comparer);
		var identities = new SortedSet<string>(new_identities);
		identities.UnionWith(existItems.Keys);

		foreach (var identity in identities)
		{
			if (existItems.ContainsKey(identity))
			{
				var data = existItems[identity];
				if (identities.Contains(identity))
				{
					data.__modified = DataSource.tag_version;
				}
				items.Add(data);
			}
			else
			{
				var pack = this.chara[identity].root[""];
				var info = pack["info"];
				var icon = pack["stand1", "0", "body"];
				var name = "[" + identity + "]";

				dynamic data = this.inspectProperty(info);
				data.id = identity;
				data.name = name;
				data.icon = this.inspectProperty(icon);
				if (icon["_hash"] != null)
				{
					data.__hash = icon["_hash"].data + "";
				}
				data.__v = DataSource.tag_version;

				items.Add(data);
			}
#if MY_DEBUG
			break;
#endif
		}

		return items;
	}

	Comparer<string> Comparer = Comparer<string>.Create((a, b) => parse_img_id(a) - parse_img_id(b));

	static int parse_img_id(string id_string)
	{
		int outputId;
		var result = Int32.TryParse(id_string, out outputId);
		if (result) {
			return outputId;
		}
		else {
			System.Console.WriteLine("ID = ??: " + id_string);
		}
		return 0;
	}

	int parse_id(string id_string)
	{
		try
		{
			return Int32.Parse(id_string);
		}
		catch (Exception ex)
		{
			Console.WriteLine("ID: " + id_string + " is not number");
			Console.WriteLine(ex.StackTrace);
			return -1;
		}
	}

	string _get_face_style(string style)
	{
#if EDGE_EQUIPLIST
		throw new NotImplementedException();
#else
		var s = String.Copy(style);
		for (var i = 0; i < 9; ++i)
		{
			unsafe
			{
				fixed (char* p = s)
				{
					p[style.Length - 3 - 4] = (char)('0' + i);//00012<3>45
				}
			}
			if (this.chara["Face"][s] != null)
			{
				return s;
			}
		}
#endif
		return style;
	}
	string get_colored_face_style(string style, int color)
	{
#if EDGE_EQUIPLIST
		var start = style.Substring(0, 5);
		var end = style.Substring(6);

		var id = start + ((char)('0' + color % 9)) + end;
		if (this.chara["Face"][id] != null)
		{
			return id;
		}
#else
		var s = String.Copy(style);
		unsafe
		{
			fixed (char* p = s)
			{
				p[style.Length - 3 - 4] = (char)('0' + color % 9);//00012<3>45
			}
		}
		if (this.chara["Face"][s] != null)
		{
			return s;
		}
#endif
		return null;
	}

	string _get_hair_style(string style)
	{
#if EDGE_EQUIPLIST
		throw new NotImplementedException();
#else
		var s = String.Copy(style);
		for (var i = 0; i < 8; ++i)
		{
			unsafe
			{
				fixed (char* p = s)
				{
					p[style.Length - 1 - 4] = (char)('0' + i);//0001234<5>
				}
			}
			if (this.chara["Hair"][s] != null)
			{
				return s;
			}
		}
#endif
		return style;
	}
	string get_colored_hair_style(string style, int color)
	{
#if EDGE_EQUIPLIST
		var start = style.Substring(0, 7);
		var end = style.Substring(8);

		var id = start + ((char)('0' + color % 8)) + end;
		if (this.chara["Hair"][id] != null)
		{
			return id;
		}
#else
		var s = String.Copy(style);
		for (var i = 0; i < 8; ++i)
		{
			unsafe
			{
				fixed (char* p = s)
				{
					p[style.Length - 1 - 4] = (char)('0' + color % 8);//0001234<5>
				}
			}
			if (this.chara["Hair"][s] != null)
			{
				return s;
			}
		}
#endif
		return null;
	}

	string get_equip_name(string category, int id)
	{
		try
		{
			var names = this.equip_names[category];
			if (names != null)
			{
				var ns = names[id + ""];
				if (ns != null)
				{
					return (string)ns["name"].data;
				}
			}
		}
		catch (Exception ex)
		{
			Console.WriteLine("ID: " + id + " : item is not exist");
			Console.WriteLine(ex.StackTrace);
		}
		return "[" + id + "]";
	}

	string get_equip_desc(string category, int id)
	{
		try
		{
			var names = this.equip_names[category];
			if (names != null)
			{
				var ns = names[id + ""];
				if (ns != null)
				{
					return (string)ns["desc"].data;
				}
			}
		}
		catch (Exception)
		{
		}
		return null;
	}

	dynamic inspectProperty(wzproperty prop)
	{
		return this.inspet.pod(prop, null as string);
	}

	//static string _inspectImage(wzproperty prop)
	//{
	//	var canvas = MInspect.inspect_canvas1(prop);
	//	if (canvas != null)
	//	{
	//		return MInspect.ImageToBase64PNG(canvas.image);
	//	}
	//	return "";
	//}
}

internal class JSON
{
	internal static string stringify(object obj)
	{
		var serializer = new JavaScriptSerializer();
		serializer.MaxJsonLength = Int32.MaxValue;
		serializer.RegisterConverters(new JavaScriptConverter[] { new ExpandoJSONConverterSerialize() });

		return serializer.Serialize(obj);
	}

	internal static object parse(string obj)
{
		var serializer = new JavaScriptSerializer();
		serializer.MaxJsonLength = Int32.MaxValue;
		serializer.RegisterConverters(new JavaScriptConverter[] { new ExpandoJSONConverterDeserialize() });

		return serializer.Deserialize<object>(obj);
	}
}

public class ExpandoJSONConverterSerialize : JavaScriptConverter
{
	public override object Deserialize(IDictionary<string, object> dictionary, Type type, JavaScriptSerializer serializer)
	{
		throw new NotImplementedException();
	}
	public override IDictionary<string, object> Serialize(object obj, JavaScriptSerializer serializer)
	{
		var result = new Dictionary<string, object>();
		var dictionary = (ICollection<KeyValuePair<string, object>>)obj;
		foreach (var item in dictionary)
			result.Add(item.Key, item.Value);
		return result;
	}
	public override IEnumerable<Type> SupportedTypes
	{
		get
		{
			return new System.Collections.ObjectModel.ReadOnlyCollection<Type>(new Type[] { typeof(System.Dynamic.ExpandoObject) });
		}
	}
}
public class ExpandoJSONConverterDeserialize : JavaScriptConverter
{
	public override object Deserialize(IDictionary<string, object> dictionary, Type type, JavaScriptSerializer serializer)
	{
		dynamic eo = new ExpandoObject();
		var eoColl = (ICollection<KeyValuePair<string, object>>)eo;

		foreach (var item in dictionary)
		{
			eoColl.Add(item);
		}

		return eo;
	}
	public override IDictionary<string, object> Serialize(object obj, JavaScriptSerializer serializer)
	{
		throw new NotImplementedException();
	}
	public override IEnumerable<Type> SupportedTypes
	{
		get
		{
			return new System.Collections.ObjectModel.ReadOnlyCollection<Type>(new Type[] { typeof(object) });
		}
	}
}
