
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

#if !EDGE_EQUIPLIST

public class Startup
{
	public async Task<object> Invoke(dynamic input)
	{
		DataSource.Init();

		Returns returns = new Returns();

		switch ((string)input.func)
		{
			case "version":
				returns.result = DataSource.archives.version;
				break;
			case "make_zorders":
				returns.result = DataProvider.make_zorders();
				break;
			case "ms"://image to base64, other to string
				returns.result = DataProvider.get_object_by_path((string)input.args.path, (bool)input.args.output_canvas);
				break;
			case "binary":
				returns.result = DataProvider.get_binary_file((string)input.args.path);
				break;
			case "sound":
				returns.result = DataProvider.get_sound_file((string)input.args.path);
				break;
			case "images":
				returns.result = DataProvider.get_image_file((string)input.args.path);
				break;
			case "_images":
				returns.result = DataProvider.get_image_gif_file((string)input.args.path);
				break;
			case "ls":
				returns.result = DataProvider.get_identities((string)input.args.path);
				break;
			case "xml":
				returns.result = (new POD_XML()).toXML((string)input.args.path);
				break;
			case "xml2":
				returns.result = (new POD_s_XML()).toXML((string)input.args.path);
				break;
			case "test":
				returns.result = DateTime.Now.ToString();
				break;
		}

		return returns;
	}
}

#endif

public class DataSource
{
	public static Ini.File iniFile;
	public static string location = "Q:\\Program Files\\MapleStory";

	public static wzarchives archives = null;
	public static wzpackage packages = null;

	static void saveConfig()
	{
		DataSource.iniFile.Write("resource", "path", DataSource.location);
	}

	static void readConfig()
	{
		DataSource.location = DataSource.iniFile.Read("resource", "path");
	}

	public static void Init()
	{
		DataSource.Init(Directory.GetCurrentDirectory() + "\\setting.ini");
	}
	public static void Init(string iniFilePath)
	{
		DataSource.iniFile = new Ini.File(iniFilePath);

		readConfig();

		if (DataSource.archives != null && DataSource.packages != null)
		{
			return;
		}

		DataSource.archives = new wzarchives(DataSource.location + "\\" + "base.wz");
		DataSource.packages = archives.root;
	}

	//public static object get_by_path(string fullpath)
	//{
	//	var paths = fullpath.Split('/');
	//
	//	if (paths.Length > 0)
	//	{
	//		wzpackage pack = DataProvider.packages[paths[0]];
	//
	//		for (var i = 1; i < paths.Length; ++i)
	//		{
	//			var name = paths[i];
	//			pack[name].
	//		}
	//	}
	//	else
	//	{
	//		return DataProvider.packages[fullpath];
	//	}
	//}

	public static void get_data(string link, out wzpackage outPack)
	{
		wzproperty prop;
		DataSource.get_data(link, out outPack, out prop);
	}
	public static void get_data(string link, out wzproperty outProp)
	{
		wzpackage pack;
		DataSource.get_data(link, out pack, out outProp);
	}
	public static void get_data(string link, out wzpackage outPack, out wzproperty outProp)
	{
		try
		{
			DataSource._get_data(link, out outPack, out outProp);
			if (outPack == null && outProp == null)
			{
				throw new Exception();
			}
			return;
		}
		catch (Exception)
		{
			try
			{
				var p = link.Split('/');
				p[0] += "2";
				link = String.Join("/", p);
				DataSource._get_data(link, out outPack, out outProp);
				if (outPack == null && outProp == null)
				{
					throw new Exception();
				}
				return;

				//System.Windows.Forms.MessageBox.Show(link, "2");
			}
			catch (Exception ex)
			{
				outPack = null;
				outProp = null;
				//System.Windows.Forms.MessageBox.Show(link + "\n" + ex.Message + "\n" + ex.StackTrace);
				Console.WriteLine("Can not get: " + link);
				Console.WriteLine(" ? " + ex.Message);
				Console.WriteLine(" ? " + ex.StackTrace);
				return;
			}
		}
	}

	protected static void _get_data(string link, out wzpackage outPack, out wzproperty outProp)
	{
		int index = link.IndexOf(".img/");

		if (0 <= index)
		{
			if (!link.EndsWith(".img/"))
			{
				outProp = DataSource._get_property(DataSource.packages[link.Substring(0, index + 4).Split('/')].root[""], link.Substring(index + 5).Split('/'), 0);
				outPack = null;
				return;
				//return MInspect.packages[link.Substring(0, index + 4).Split('/')].root[""][link.Substring(index + 5).Split('/')];
			}
			else
			{
				try
				{
					outProp = DataSource.packages[link.Substring(0, index + 4).Split('/')].root[""];
					outPack = null;
					return;
				}
				catch (Exception)
				{
					outProp = null;
					outPack = DataSource.packages[link.Substring(0, index + 4).Split('/')];
					return;
				}
			}
		}
		else
		{
			outProp = null;
			outPack = DataSource.packages[link.Split('/')];
			return;
		}
	}

	protected static wzproperty _get_property(wzproperty property, string[] link, int step)
	{
		if (link.Length == step)
		{
			return property;
		}

		var name = link[step];

		var sub_property = property[name];

		if (property.type == 5)// UOL
		{
			return DataSource._get_property((property.data as wzuol).target, link, step);
		}
		if (sub_property != null)
		{
			return DataSource._get_property(sub_property, link, step + 1);
		}

		return null;
	}
	//protected static wzproperty get_property(string link)
	//{
	//	int index = link.IndexOf(".img/");
	//	if (!(0 <= index && !link.EndsWith(".img/")))
	//	{
	//		return null;
	//	}
	//
	//	var package = MInspect.packages[link.Substring(0, index + 4).Split('/')];
	//	if (package == null)
	//	{
	//		return null;
	//	}
	//
	//	var root = package.root[""];
	//	if (root == null)
	//	{
	//		return null;
	//	}
	//
	//	return MInspect._get_property(root, link.Substring(index + 5).Split('/'), 0);
	//}

	DataSource()
	{
		throw new System.NotImplementedException();
	}
}

public class DataProvider
{
	DataProvider()
	{
	}

	public static dynamic make_zorders()
	{
		dynamic eo = new ExpandoObject();
		var eoColl = (ICollection<KeyValuePair<string, object>>)eo;
		List<string> zorders;

		var package = DataSource.packages;

		zorders = (null == package) ? new List<string>() : new List<string>(package["zmap.img"].root[""].identities);

		zorders.Reverse();

		var index = 0;
		foreach (var i in zorders)
		{
			eoColl.Add(new KeyValuePair<string, object>(i, ++index));
		}

		return eo;
	}

	public static dynamic get_identities(string path)
	{
		wzpackage pack;
		wzproperty prop;

		DataSource.get_data(path, out pack, out prop);

		if (prop != null)
		{
			return prop.identities;
		}
		else if (pack != null)
		{
			return pack.identities;
		}

		return null;
	}

	public static dynamic get_object_by_path(string path, bool hasBinaryToBase64)
	{
		wzpackage pack;
		wzproperty prop;
		ObjectInspectorBase inspector;

		DataSource.get_data(path, out pack, out prop);

		if (hasBinaryToBase64)
		{
			inspector = new Inspector_Base64();
		}
		else
		{
			inspector = new Inspector_Plain();
		}

		if (prop != null)
		{
			return inspector.pod(prop);
		}
		else if (pack != null)
		{
			return inspector.pod(prop);
		}

		return null;
	}

	public static dynamic get_binary_file(string path)
	{
		wzproperty prop;

		DataSource.get_data(path, out prop);

		if (prop != null)
		{
			var sound = prop.data as wzsound;

			dynamic eo = new ExpandoObject();

			eo.mime = "application/octet-stream";
			//eo.mime = "text/plain";
			//eo.mime = "text/html";
			eo.data = sound.data;

			return eo;
		}
		return null;
	}
	public static dynamic get_sound_file(string path)
	{
		wzproperty prop;

		DataSource.get_data(path, out prop);

		if (prop != null)
		{
			var sound = prop.data as wzsound;

			dynamic eo = new ExpandoObject();

			//eo.ext = (sound.pcm ? ".wav" : ".mp3");
			eo.mime = (sound.pcm ? "audio/wav" : "audio/mp3");
			eo.data = sound.wave ?? sound.data;

			return eo;
		}
		return null;
	}
	public static dynamic get_image_file(string path)
	{
		wzproperty prop;

		DataSource.get_data(path, out prop);

		if (prop != null)
		{
			var canvas = Tools.inspect_canvas1(prop);
			if (canvas != null)
			{
				var image = canvas.image;

				using (MemoryStream stream = new MemoryStream())
				{
					image.Save(stream, ImageFormat.Png);

					dynamic eo = new ExpandoObject();
					eo.mime = "image/png";
					eo.data = stream.ToArray();

					return eo;
				}
			}
		}
		return null;
	}
	public static dynamic get_image_gif_file(string path)
	{
		wzproperty prop;

		DataSource.get_data(path, out prop);

		if (prop != null)
		{
			var canvas = Tools.inspect_canvas1(prop);
			if (canvas != null)
			{
				var image = canvas.image;

				using (MemoryStream stream = new MemoryStream())
				{
					image.Save(stream, ImageFormat.Gif);

					dynamic eo = new ExpandoObject();
					eo.mime = "image/gif";
					eo.data = stream.ToArray();

					return eo;
				}
			}
		}
		return null;
	}
}


public class Tools
{
	public Tools()
	{
	}

	public static void _SavePNG(Image image, System.IO.Stream stream)
	{
		image.Save(stream, ImageFormat.Png);
		stream.Position = 0;
	}
	public static byte[] ImageToBufferPNG(Image image)
	{
		using (MemoryStream stream = new MemoryStream())
		{
			Tools._SavePNG(image, stream);
			return stream.ToArray();
		}
	}
	public static string ImageToBase64PNG(Image image)
	{
		//stopwatch.Start();

		string binStr = Convert.ToBase64String(Tools.ImageToBufferPNG(image));

		//stopwatch.Stop();

		return "data:image/png;base64," + binStr;
	}
	public static string BinaryToBase64String(byte[] binary)
	{
		return Convert.ToBase64String(binary);
	}
	public static wzproperty inspect_canvas(wzproperty property)
	{
		if (null != property)
		{
			if (4 == property.type)
				return property;
			if (5 == property.type)
				return inspect_canvas((property.data as wzuol).target);
		}

		return null;
	}
	public static wzproperty _inspect_canvas1(wzproperty property)
	{
		property = inspect_canvas(property);

		if (null != property)
		{
			wzproperty target;
			string link = property.query(null as string, "source") ?? property.query(null as string, "_outlink") ?? property.query(null as string, "_inlink");

			if (null == link)
			{
				target = property;
			}
			else
			{
				int index = link.IndexOf(".img/");

				if (0 <= index)
					DataSource.get_data(link, out target);
				else
					target = property.root[link.Split('/')];

				//if (0 <= index)
				//	target = packages.query(link.Substring(0, index + 4).Split('/'))[link.Substring(index + 5).Split('/')];
				//else
				//	target = property.root[link.Split('/')];
			}

			return target;
		}

		return null;
	}
	public static wzcanvas inspect_canvas1(wzproperty property)
	{
		property = Tools._inspect_canvas1(property);

		if (null != property)
		{
			wzcanvas source;

			source = property.query<wzcanvas>(null);

			return source;
		}

		return null;
	}
}

public class ObjectInspectorBase
{
	public ObjectInspectorBase()
	{
	}

	public virtual object inspect_image(Image image)
	{
		throw new System.NotImplementedException();
	}

	public virtual object inspect_sound(wzsound sound)
	{
		throw new System.NotImplementedException();
	}

	public string get_local_path(wzproperty prop)
	{
		return prop.absolute.Replace('\0', '/').Substring(1);
	}

	public object pod_property(wzproperty prop, int deep = Int32.MaxValue)
	{
		if ((deep - 1) >= 0)
		{
			dynamic eo = new ExpandoObject();
			var eoColl = (ICollection<KeyValuePair<string, object>>)eo;

			//foreach (var id in prop.identities)
			//{
			//	var i = prop[id];
			foreach (var i in prop.values)
			{
#if !EQUIPLIST
				if (i.identity.StartsWith("_"))
				{
					continue;
				}
#endif
				var p = this.pod(i, deep - 1);

				eoColl.Add(new KeyValuePair<string, object>(i.identity, p));
			}
			return eo;
		}
		else
			return "...";
	}

	public object pod(wzproperty prop, int deep = Int32.MaxValue)
	{
		if (prop == null)
		{
			return null;
		}
		try
		{
			var type = prop.type;

			switch (type)
			{
				case 0: // "Shape2D#Convex2D"
					return "{Shape2D#Convex2D}";            //return null;
				case 1: // Shape2D#Vector2D
					return new vec2(prop.data as wzvector); //return (prop.data as wzvector).content;
				case 2: // Sound_DX8
						//if (output_canvas)
						//{
					return this.inspect_sound(prop.data as wzsound);                     //return (data as wzsound).content;
																						 //}
																						 //else
																						 //{
																						 //	return null;
																						 //}
				case 3: // "Property"
					return this.pod_property(prop, deep);                  //return null;
				case 4: // Canvas
					{
						dynamic eo = this.pod_property(prop, deep);                    //return (data as wzcanvas).content;
						var eoColl = (ICollection<KeyValuePair<string, object>>)eo;

#if EDGE_EQUIPLIST
						var _target_prop = Tools._inspect_canvas1(prop);
						var canvas = Tools.inspect_canvas1(_target_prop);
#else
						var canvas = Tools.inspect_canvas1(prop);
#endif
						if (canvas != null)
						{
							//if (output_canvas)
							//{
							object canvas_data;
							canvas_data = this.inspect_image(canvas.image);
							eoColl.Add(new KeyValuePair<string, object>("", canvas_data));
							//}
							//else
							//{
							//	eoColl.Add(new KeyValuePair<string, object>("", ""));
							//}
							eoColl.Add(new KeyValuePair<string, object>("__w", canvas.width));
							eoColl.Add(new KeyValuePair<string, object>("__h", canvas.height));
#if EDGE_EQUIPLIST
							if (_target_prop["_outlink"] != null) {
								var _hash = _target_prop["_hash"].data + "";
								if (eoColl.Contains(new KeyValuePair<string, object>("_hash", "")))
									eoColl.Add(new KeyValuePair<string, object>("_hash", _hash));
							}
#endif
						}
						else
						{
							eoColl.Add(new KeyValuePair<string, object>("__isEmpty", true));
						}

						return eo;
					}
				case 5: // UOL
					return this.pod((prop.data as wzuol).target, deep);
				//return (prop.data as wzuol).link;//need inspect
				//case 14: // 0x08
				//	return prop.data;//trim_content(data + "");
				default:
					//try {
					//	Encoding utf8 = new UTF8Encoding(true, true);
					//	Byte[] encodedBytes = utf8.GetBytes((string)prop.data);
					//	String decodedString = utf8.GetString(encodedBytes);
					//	return decodedString;
					//}
					//catch (Exception)
					//{
					//	return null;
					//}
					return prop.data;
			}
		}
		catch (Exception ex)
		{
			return "<Error: " + ex.Message + "\n" + ex.StackTrace + ">";
		}
		return "<unknow error>";
	}
	public object pod(wzpackage pack, int deep = Int32.MaxValue)
	{
		if (pack == null)
		{
			return null;
		}
		try
		{
			if ((deep - 1) >= 0)
			{
				dynamic eo = new ExpandoObject();
				var eoColl = (ICollection<KeyValuePair<string, object>>)eo;

				//foreach (var id in pack.identities)
				//{
				//	var i = pack[id];
				foreach (var i in pack.values)
				{
					var p = this.pod(i, deep - 1);

					eoColl.Add(new KeyValuePair<string, object>(i.identity, p));
				}
				return eo;
			}
			else
				return "...";
		}
		catch (Exception ex)
		{
			return "<Error: " + ex.Message + "\n" + ex.StackTrace + ">";
		}
		return "<unknow error>";
	}
}

public class Inspector_Plain : ObjectInspectorBase
{
	public Inspector_Plain()
	{
	}

	public override object inspect_image(Image image)
	{
		return "";
	}

	public override object inspect_sound(wzsound sound)
	{
		return "";
	}
}

public class Inspector_Base64 : ObjectInspectorBase
{
	public Inspector_Base64()
	{
	}

	public override object inspect_image(Image image)
	{
		return Tools.ImageToBase64PNG(image);
	}

	public override object inspect_sound(wzsound sound)
	{
		//this._inspect_sound_b(sound);
		//throw new NotImplementedException();
		return Tools.BinaryToBase64String(sound.data);
	}
}

//public class Inspector_Buffer : InspectorBase
//{
//	public override object inspect_image(Image image)
//	{
//		return ImageToBufferPNG(image);
//	}
//	public override object inspect_sound(wzsound sound)
//	{
//		return sound.wave ?? sound.data;
//	}
//}

public class POD_XML
{
	protected string imgPath = "";

	public string toXML(string link)
	{
		return this._toXML(link);
	}

	protected string _toXML(string link)
	{
		var pak = this._getPropertyByLink(link);

		try
		{
			if (pak != null)
			{
				return this._wzimgToXML((string)pak[0], (wzproperty)pak[1]);
			}
		}
		catch (Exception ex)
		{
			System.Windows.Forms.MessageBox.Show(link + "\n\t" + ex.StackTrace, "Error");
		}
		return "<error>unknow error</error>";
	}

	//protected string _wzpropertyToXML(string name, wzproperty prop)
	//{
	//	StringBuilder sb = new StringBuilder();
	//
	//	sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");
	//
	//	sb.Append("<?xml-stylesheet href=\"/wzproperty.xslt\" type=\"text/xsl\" ?>");
	//
	//	sb.Append("<xmldump><imgdir name=\"");
	//	sb.Append(name);
	//	sb.Append("\">");
	//
	//	sb.Append(this.enum_property(prop));
	//
	//	sb.Append("</imgdir></xmldump>");
	//
	//	return sb.ToString();
	//}
	protected string _wzimgToXML(string name, wzproperty prop)
	{
		StringBuilder sb = new StringBuilder();

		sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");

		sb.Append("<?xml-stylesheet href=\"/wzproperty.xslt\" type=\"text/xsl\" ?>");

		sb.Append("<xmldump><wzimg name=\"");
		sb.Append(name);
		sb.Append("\">");

		sb.Append(this.enum_property(prop));

		sb.Append("</wzimg></xmldump>");

		return sb.ToString();
	}

	protected object[] _getPropertyByLink(string link)
	{
		string name = null;
		wzproperty prop = null;

		try
		{
			if (link.EndsWith(".img"))
			{
				this.imgPath = link + "/";

				var paths = link.Split('/');
				name = paths[paths.Length - 1];
				prop = DataSource.packages[paths].root[""];

				return new object[] {
					name, prop
				};
			}
			else if (link.EndsWith(".img/"))
			{
				this.imgPath = link;

				var paths = link.Substring(0, link.Length - 1).Split('/');
				name = paths[paths.Length - 1];
				prop = DataSource.packages[paths].root[""];

				return new object[] {
					name, prop
				};
			}
			else
			{
				var index = link.IndexOf(".img/");
				var ns = link.Split('/');
				if (index >= 0 && (index + 5) < link.Length)
				{
					this.imgPath = link.Substring(0, index + 5);

					DataSource.get_data(link, out prop);

					return new object[] {
						ns[ns.Length - 1], prop
					};
				}
			}
			System.Windows.Forms.MessageBox.Show(link);
		}
		catch (Exception ex)
		{
			System.Windows.Forms.MessageBox.Show(ex.Message + "\n\t" + ex.StackTrace);
		}
		return null;
	}

	protected StringBuilder enum_property(wzproperty prop)
	{
		StringBuilder sb = new StringBuilder();

		foreach (var i in prop.values)
		{
#if !EQUIPLIST
			if (i.identity.StartsWith("_"))
			{
				continue;
			}
#endif

			sb.Append(this.pod(i.identity, i));
		}
		return sb;
	}

	protected StringBuilder pod(string name, wzproperty prop)
	{
		StringBuilder sb = new StringBuilder();

		if (prop == null)
		{
			return sb;
		}
		try
		{
			var type = prop.type;
			switch (type)
			{
				case 1: // Shape2D#Vector2D
					sb.Append(this.Vector(name, prop.data as wzvector));//return (prop.data as wzvector).content;
					break;
				case 3: // "Property"
					sb.Append(this.ImgDir(name, prop));                  //return null;
					break;
				case 4: // Canvas
					sb.Append(this.Canvas(name, prop));                                    //
					break;
				case 5: // UOL
					sb.Append(this.pod(name, (prop.data as wzuol).target));     //return (prop.data as wzuol).link;//need inspect
					break;
				case 0x02 + 6: goto case 0x0b + 6;//int16
				case 0x03 + 6: goto case 0x13 + 6;//int
				case 0x04 + 6: sb.Append(this.Value("float32", name, prop)); break;
				case 0x05 + 6: sb.Append(this.Value("float64", name, prop)); break;
				case 0x08 + 6: sb.Append(this.StringValue("string", name, prop)); break;
				case 0x09 + 6: break;// "{Package}";
				case 0x0b + 6: sb.Append(this.Value("int16", name, prop)); break;
				case 0x13 + 6: sb.Append(this.Value("int", name, prop)); break;
				case 0x14 + 6: sb.Append(this.Value("int64", name, prop)); break;
				default: // undefined type
					System.Windows.Forms.MessageBox.Show(prop.decorate_absolute + "\n\ttype:" + type, "undefined type");
					sb.Append("<undefined_type name=\"" + name + "\" value=\"" + (prop.data + "") + "\"/>");
					break;
			}
		}
		catch (Exception ex)
		{
			Console.Write("<cs Error: " + ex.Message + "\n" + ex.StackTrace + ">");
		}
		return sb;
	}

	protected virtual StringBuilder ImgDir(string name, wzproperty prop)
	{
		StringBuilder sb = new StringBuilder();
		sb.Append("<imgdir name=\"");
		sb.Append(name);
		sb.Append("\">");
		sb.Append(this.enum_property(prop));
		sb.Append("</imgdir>");
		return sb;
	}

	protected virtual string StringValue(string type, string name, wzproperty prop)
	{
		var rgx = new System.Text.RegularExpressions.Regex("\\\\r\\\\n|\\\\n|\\\\r");
		string value = rgx.Replace((prop.data + ""), "↵");
		return "<" + type + " name=\"" + name + "\" value=\"" + (value) + "\"/>";
	}

	protected virtual string Value(string type, string name, wzproperty prop)
	{
		return "<" + type + " name=\"" + name + "\" value=\"" + (prop.data + "") + "\"/>";
	}

	protected virtual StringBuilder Vector(string name, wzvector vec)
	{
		StringBuilder sb = new StringBuilder("<vector name=\"");
		sb.Append(name);
		sb.Append("\" x=\"");
		sb.Append(vec.x);
		sb.Append("\" y=\"");
		sb.Append(vec.y);
		sb.Append("\"/>");
		return sb;
	}

	protected virtual StringBuilder Canvas(string name, wzproperty prop)
	{
		StringBuilder sb = new StringBuilder();

		var canvas = Tools.inspect_canvas1(prop);
		if (canvas != null)
		{
			sb.Append("<canvas name=\"");
			sb.Append(name);
			sb.Append("\" width=\"");
			sb.Append(canvas.width);
			sb.Append("\" height=\"");
			sb.Append(canvas.height);
			sb.Append("\" basedata=\"");
			sb.Append(this.inspect_image(canvas.image));
			sb.Append("\">");
			sb.Append(this.enum_property(prop));
			sb.Append("</canvas>");
		}

		return sb;
	}

	protected string inspect_image(Image image)
	{
		return Convert.ToBase64String(Tools.ImageToBufferPNG(image));
	}
}

public class POD_s_XML : POD_XML
{
	protected override StringBuilder Canvas(string name, wzproperty prop)
	{
		StringBuilder sb = new StringBuilder();

		var canvas = Tools.inspect_canvas1(prop);
		if (canvas != null)
		{
			sb.Append("<canvas name=\"");
			sb.Append(name);
			sb.Append("\" width=\"");
			sb.Append(canvas.width);
			sb.Append("\" height=\"");
			sb.Append(canvas.height);
			sb.Append("\" url=\"");
			sb.Append(this.imgPath + prop.absolute.Replace('\0', '/').Substring(1));
			sb.Append("\">");
			sb.Append(this.enum_property(prop));
			sb.Append("</canvas>");
		}

		return sb;
	}
}

internal class vec2
{
	//vec2(int x, int y)
	//{
	//	this.x = x;
	//	this.y = y;
	//}
	public vec2(wzvector vec)
	{
		this.x = vec.x;
		this.y = vec.y;
	}
	public int x, y;
}

internal class Returns
{
	public Returns()
	{
		this.result = null;
		this.status = "";
	}
	public object result;
	public string status;

	public void LogWriteLine(string text)
	{
		//this.status += text + "\n";
	}
}

namespace Ini
{
	public class File
	{
		public string path;

		[DllImport("kernel32")]
		private static extern long WritePrivateProfileString(string section, string key, string val, string filePath);

		[DllImport("kernel32")]
		private static extern int GetPrivateProfileString(string section, string key, string def, StringBuilder retVal, int size, string filePath);

		public File(string INIPath)
		{
			path = INIPath;
		}

		public void Write(string Section, string Key, string Value)
		{
			WritePrivateProfileString(Section, Key, Value, this.path);
		}

		public string Read(string Section, string Key)
		{
			StringBuilder temp = new StringBuilder(255);
			int i = GetPrivateProfileString(Section, Key, "", temp, 255, this.path);
			return temp.ToString();
		}
	}
}


