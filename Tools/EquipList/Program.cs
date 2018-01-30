
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;

using System.Dynamic;

using System.Web.Script.Serialization;

using System.Diagnostics;
using System.Collections;

using System.Configuration;


namespace EquipList
{
	class Program
	{
		[STAThread]
		static void Main(string[] args)
		{
			Console.WriteLine("init");
			DataSource.Init(args.Length > 1 ? args[1] : "../../setting.ini");

			var data_extracter = new DataExtracter("");
			Console.WriteLine(DataSource.archives.location);
			Console.WriteLine(DataSource.archives.version);

			Console.WriteLine("start");
			data_extracter.extractAll(args.Length > 0 ? args[0] : "./data");

			Console.WriteLine("end");
		}
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

			this.equip_names = DataSource.packages["String", "Eqp.img"].root[""]["Eqp"];
		}
	}

	internal void extractAll(string path)
	{
		Console.WriteLine("version: " + DataSource.archives.version);

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

	void output_file(string path, Func<dynamic> fnExtract)
	{
		if (File.Exists(path))
		{
			return;
		}

		dynamic eo = fnExtract();

		var str = JSON.stringify(eo);

		using (FileStream fs = new FileStream(path, FileMode.Create))
		using (StreamWriter ws = new StreamWriter(fs))
		{
			fs.Seek(0, SeekOrigin.Begin);

			ws.Write(str);
		}
	}

	void output_file(string path, Func<string, string, dynamic> fnExtract, string category, string id_prefix)
	{
		if (File.Exists(path))
		{
			return;
		}

		dynamic eo = fnExtract(category, id_prefix);

		var str = JSON.stringify(eo);

		using (FileStream fs = new FileStream(path, FileMode.Create))
		using (StreamWriter ws = new StreamWriter(fs))
		{
			fs.Seek(0, SeekOrigin.Begin);

			ws.Write(str);
		}
	}

	object extract_cash_weapon(string category, string id_prefix)
	{
		var items = new ArrayList();

		IEnumerable<string> identities =
			from identity in this.chara[category].identities
			where identity.StartsWith(id_prefix)
			select identity;

		foreach (var identity in identities)
		{
			var id = identity.Replace(".img", "");
			var id32 = this.parse_id(id);

			if (id32 >= 0)
			{
				var pack = this.chara[category][identity].root[""];
				var info = pack["info"];
				var name = this.get_equip_name(category, id32);
				var desc = get_equip_desc(category, id32);

				dynamic data = this.inspectProperty(info);
				data.id = id;
				data.name = name;
				data.desc = desc;
				//
				var __t = new List<string>(pack.identities);
				__t.Remove("info");
				data.__t = String.Join(", ", __t.ToArray()); ;
				//
				data.icon = data.iconRaw;
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
	object extract_equip(string category, string id_prefix)
	{
		var items = new ArrayList();

		IEnumerable<string> identities =
			from identity in this.chara[category].identities
			where identity.StartsWith(id_prefix)
			select identity;

		foreach (var identity in identities)
		{
			var id = identity.Replace(".img", "");
			var id32 = this.parse_id(id);

			if (id32 >= 0)
			{
				var pack = this.chara[category][identity].root[""];
				var info = pack["info"];
				var name = this.get_equip_name(category, id32);
				var desc = get_equip_desc(category, id32);

				dynamic data = this.inspectProperty(info);
				data.id = id;
				data.name = name;
				data.desc = desc;
				//
				data.icon = data.iconRaw;
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

	object extract_face()
	{
		var items = new ArrayList();

		var list = new HashSet<string>();
		foreach (var i in this.chara["Face"].identities)
		{
			var style = this.get_colored_face_style(i, this.faceColor);

			if (style != null && !list.Contains(style))
			{
				list.Add(style);
			}
		}

		foreach (var identity in list)
		{
			var id = identity.Replace(".img", "");
			var id32 = this.parse_id(id);

			if (id32 >= 0)
			{
				var pack = this.chara["Face", identity].root[""];
				var info = pack["info"];
				var icon = pack["blink", "0", "face"];
				var name = this.get_equip_name("Face", id32);

				dynamic data = this.inspectProperty(info);
				data.id = id;
				data.name = name;
				data.icon = this.inspectProperty(icon);

				items.Add(data);
			}
#if MY_DEBUG
			break;
#endif
		}

		return items;
	}

	object extract_hair()
	{
		var items = new ArrayList();

		var list = new HashSet<string>();
		foreach (var i in this.chara["Hair"].identities)
		{
			var style = this.get_colored_hair_style(i, this.hairColor);
			if (style != null && !list.Contains(style))
			{
				list.Add(style);
			}
		}

		foreach (string identity in list)
		{
			//#if MY_DEBUG
			//			string _identity = "00033426.img";//has no place: hair
			//#endif
			var id = identity.Replace(".img", "");
			var id32 = this.parse_id(id);

			if (id32 >= 0)
			{
				var pack = this.chara["Hair"][identity].root[""];
				var info = pack["info"];
				var icon = pack["stand1", "0", "hairOverHead"] ?? pack["stand1", "0", "hair"];
				var name = this.get_equip_name("Hair", id32);

				dynamic data = this.inspectProperty(info);
				data.id = id;
				data.name = name;
				data.icon = this.inspectProperty(icon);

				items.Add(data);
			}
#if MY_DEBUG
			break;
#endif
		}

		return items;
	}

	object extract_head()
	{
		var items = new ArrayList();

		IEnumerable<string> heads =
			from identity in this.chara.identities
			where identity.StartsWith("0001") && identity.EndsWith(".img")
			select identity;

		foreach (var identity in heads)
		{
			var id = identity.Replace(".img", "");
			var pack = this.chara[identity].root[""];
			var info = pack["info"];
			var icon = pack["stand1", "0", "head"];
			var name = (string)id;

			dynamic data = this.inspectProperty(info);
			data.id = id;
			data.name = name;
			data.icon = this.inspectProperty(icon);

			items.Add(data);

#if MY_DEBUG
			break;
#endif
		}

		return items;
	}

	object extract_body()
	{
		var items = new ArrayList();

		//pack://Character/00002001.img
		//info://Character/00002001.img/info
		//img://Character/00002001.img/stand1/0/body

		IEnumerable<string> bodies =
			from identity in this.chara.identities
			where identity.StartsWith("0000") && identity.EndsWith(".img")
			select identity;

		foreach (var identity in bodies)
		{
			var id = identity.Replace(".img", "");
			var pack = this.chara[identity].root[""];
			var info = pack["info"];
			var icon = pack["stand1", "0", "body"];
			var name = (string)id;

			dynamic data = this.inspectProperty(info);
			data.id = id;
			data.name = name;
			data.icon = this.inspectProperty(icon);

			items.Add(data);

#if MY_DEBUG
			break;
#endif
		}

		return items;
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
		var s = String.Copy(style);
		for (var i = 0; i < 9; ++i)
		{
			unsafe
			{
				fixed (char* p = s)
				{
					p[style.Length - 7] = (char)('0' + i);
				}
			}
			if (this.chara["Face"][s] != null)
			{
				return s;
			}
		}
		return style;
	}
	string get_colored_face_style(string style, int color)
	{
		var s = String.Copy(style);
		unsafe
		{
			fixed (char* p = s)
			{
				p[style.Length - 7] = (char)('0' + color % 9);
			}
		}
		if (this.chara["Face"][s] != null)
		{
			return s;
		}
		return null;
	}

	string _get_hair_style(string style)
	{
		var s = String.Copy(style);
		for (var i = 0; i < 8; ++i)
		{
			unsafe
			{
				fixed (char* p = s)
				{
					p[style.Length - 5] = (char)('0' + i);
				}
			}
			if (this.chara["Hair"][s] != null)
			{
				return s;
			}
		}
		return style;
	}
	string get_colored_hair_style(string style, int color)
	{
		var s = String.Copy(style);
		for (var i = 0; i < 8; ++i)
		{
			unsafe
			{
				fixed (char* p = s)
				{
					p[style.Length - 5] = (char)('0' + color % 8);
				}
			}
			if (this.chara["Hair"][s] != null)
			{
				return s;
			}
		}
		return null;
	}

	string get_equip_name(string category, int id)
	{
		try
		{
			var ns = this.equip_names[category, "" + id];
			if (ns != null)
			{
				return (string)ns["name"].data;
			}
		}
		catch (Exception ex)
		{
			Console.WriteLine("ID: " + id + " : item has no name or item is not exist");
			Console.WriteLine(ex.StackTrace);
		}

		return "[" + id + "]";
	}

	string get_equip_desc(string category, int id)
	{
		try
		{
			var ns = this.equip_names[category, "" + id];
			if (ns != null)
			{
				return (string)ns["desc"].data;
			}
		}
		catch (Exception)
		{
		}
		return null;
	}

	dynamic inspectProperty(wzproperty prop)
	{
		return this.inspet.pod(prop);
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
	internal static JavaScriptSerializer serializer = null;
	private static Func<object, string> _func = JSON.__stringify;

	internal JSON()
	{
	}

	internal static Func<object, string> stringify { get { return JSON._func; } }

	internal static string _stringify(object obj)
	{
		return serializer.Serialize(obj);
	}

	internal static string __stringify(object obj)
	{
		{
			serializer = new JavaScriptSerializer();
			serializer.MaxJsonLength = Int32.MaxValue;
			serializer.RegisterConverters(new JavaScriptConverter[] { new ExpandoJSONConverter() });
			_func = JSON._stringify;
		}
		return serializer.Serialize(obj);
	}

	//static internal string stringify(object obj)
	//{
	//	if (obj != null)
	//	{
	//		var sb = new StringBuilder();
	//
	//		if (obj.GetType() == typeof(ExpandoObject))
	//		{
	//			var dict = (ICollection<KeyValuePair<string, object>>)obj;
	//
	//			var entries = dict.Select(d =>
	//				string.Format("\"{0}\": {1}", d.Key, string.Join(",", stringify(d.Value))));
	//
	//			sb.Append("{" + string.Join(",", entries) + "}");
	//		}
	//		else
	//		{
	//			sb.Append(new JavaScriptSerializer().Serialize(obj));
	//		}
	//
	//		return sb.ToString();
	//	}
	//	return "\"\"";
	//}
}

public class ExpandoJSONConverter : JavaScriptConverter
{
	public override object Deserialize(IDictionary<string, object> dictionary, Type type, JavaScriptSerializer serializer)
	{
		throw new NotImplementedException();
	}
	public override IDictionary<string, object> Serialize(object obj, JavaScriptSerializer serializer)
	{
		var result = new Dictionary<string, object>();
		var dictionary = obj as IDictionary<string, object>;
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
