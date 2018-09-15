﻿
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

#if !EDGE_EQUIPLIST && !EQUIPLIST

public class Startup
{
	public static string setting = "";

	public async Task<object> Invoke(dynamic input)
	{
		switch ((string)input.func)
		{
			case "load":
				Startup.setting = (string)input.args.path;
				return DataSource.Init(Startup.setting);
				break;
			case "version":
				return DataSource.archives.version;
				break;
			case "tag":
				return DataSource.tag;
				break;
			case "make_zorders":
				return DataProvider.make_zorders();
				break;
			case "data":
				return DataProvider.get_data_by_path((string)input.args.path);
				break;
			case "pack"://data + base64 image
				return DataProvider.get_bundle_by_path((string)input.args.path);
				break;
			case "binary":
				return DataProvider.get_binary_file((string)input.args.path);
				break;
			case "sound":
				return DataProvider.get_sound_file((string)input.args.path);
				break;
			case "images":
				return DataProvider.get_image_file((string)input.args.path);
				break;
			case "_images":
				return DataProvider.get_image_gif_file((string)input.args.path);
				break;
			case "font":
				return DataProvider._get_binary_file((string)input.args.path, "application/x-font-ttf");
				break;
			case "ls":
				return DataProvider.get_identities((string)input.args.path);
				break;
			case "xml":
				return DataProvider.get_xml((string)input.args.path);
				break;
			case "xml2":
				return DataProvider.get_xml2((string)input.args.path);
				break;
			case "test":
				return DateTime.Now.ToString();
				break;
		}

		return null;
	}
}

#endif

internal class DataSource
{
	public static Ini.File iniFile;
	public static string tag = "";
	public static string location = "Q:\\Program Files\\MapleStory";

	public static wzarchives archives = null;
	public static wzpackage packages = null;

	public static string tag_version = "";

	public static void writeLog(string text)
	{
#if DEBUG
		Console.Write(DataSource.tag_version);
		Console.Write("> ");
		Console.Write(text);
		Console.Write("\n");
#endif
	}

	static void saveConfig()
	{
		DataSource.iniFile.Write("resource", "path", DataSource.location);
	}

	static void readConfig()
	{
		DataSource.tag = DataSource.iniFile.Read("resource", "tag");
		DataSource.location = DataSource.iniFile.Read("resource", "path");
	}

	public static bool Init()
	{
		return DataSource.Init(Directory.GetCurrentDirectory() + "\\setting.ini");
	}
	public static bool Init(string iniFilePath)
	{
		try
		{
			DataSource.iniFile = new Ini.File(iniFilePath);

			readConfig();

			if (DataSource.archives != null && DataSource.packages != null)
			{
				DataSource.writeLog("Already loaded");
				return false;
			}
			DataSource.archives = new wzarchives(DataSource.location + "\\" + "base.wz");
			DataSource.packages = archives.root;

			DataSource.tag_version = DataSource.tag + "" + archives.version;

			Console.Write(DataSource.tag_version);
			Console.Write("> ");
			Console.Write(DataSource.archives.location);
			Console.Write("\n");
		}
		catch (Exception ex)
		{
			DataSource.writeLog(ex.Message);
			DataSource.writeLog(ex.StackTrace);
		}
		return true;
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
		_get_data(link, out outPack, out outProp);

		if (outProp != null && outProp.type == 5)// UOL
		{
			outProp = (outProp.data as wzuol).target;
		}
	}
	private static void _get_data(string link, out wzpackage outPack, out wzproperty outProp)
	{
		try
		{
			string[] sections = link.Split('/');

			wzpackage pack = DataSource.packages[sections[0]];
			wzproperty prop = null;

			// find archive

			if (pack != null)
			{
				_get_data(sections, ref pack, ref prop);
			}
			if (pack == null && prop == null)
			{
				var name = sections[0];

				for (int i = 1; i <= 2; ++i)
				{
					if ((pack = DataSource.packages[name + (i + 1)]) != null)
					{
						_get_data(sections, ref pack, ref prop);
						if (pack != null || prop != null)
						{
							outPack = pack;
							outProp = prop;
							return;
						}
					}
					if ((pack = DataSource.packages[name + i.ToString("000")]) != null)
					{
						_get_data(sections, ref pack, ref prop);
						if (pack != null || prop != null)
						{
							outPack = pack;
							outProp = prop;
							return;
						}
					}
				}
			}
			else
			{
				outPack = pack;
				outProp = prop;
				return;
			}

			outPack = null;
			outProp = null;

			throw new Exception("Not found package or property: " + link);
		}
		catch (Exception ex)
		{
			outPack = null;
			outProp = null;
			//System.Windows.Forms.MessageBox.Show(link + "\n" + ex.Message + "\n" + ex.StackTrace);
			DataSource.writeLog("can not get: " + link);
			DataSource.writeLog(" ? " + ex.Message);
			DataSource.writeLog(" ? " + ex.StackTrace);
			return;
		}
	}
	private static void _get_data(string[] sections, ref wzpackage outPack, ref wzproperty outProp)
	{
		// find package

		int index = 1;
		if (sections.Length != 1)
		{
			for (; index < sections.Length; ++index)
			{
				var section = sections[index];

				if (outPack.identities.Contains(section))
				{
					outPack = outPack.values[outPack.identities.IndexOf(section)];
				}
				else if (outPack.root != null && (outProp = outPack.root[""]) != null)
				{
					outPack = null;
					break;
				}
				else
				{
					outPack = null;
					outProp = null;
					return;
				}
			}
		}

		// find property

		if (outProp == null)
		{
			if (outPack.root != null && (outProp = outPack.root[""]) != null)
			{
				outPack = null;
				return;
			}
		}
		else
		{
			for (; index < sections.Length; ++index)
			{
				var section = sections[index];

				if (outProp.identities.Contains(section))
				{
					outProp = outProp.values[outProp.identities.IndexOf(section)];
				}
				else
				{
					outPack = null;
					outProp = null;
					return;
				}
			}
		}

		if (index < sections.Length)
		{
			outPack = null;
			outProp = null;
			return;
		}
	}

	DataSource()
	{
		throw new System.NotImplementedException();
	}
}

internal class DataProvider
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

		zorders = (null == package) ? new List<string>() : new List<string>(package["zmap"].root[""].identities);

		zorders.Reverse();

		var index = 0;
		foreach (var i in zorders)
		{
			eoColl.Add(new KeyValuePair<string, object>(i, ++index));
		}

		return eo;
	}

	public static Returns get_identities(string path)
	{
		wzpackage pack;
		wzproperty prop;

		DataSource.get_data(path, out pack, out prop);

		if (prop != null)
		{
			Returns returns = new Returns();
			returns.mime = "application/json; charset=utf-8";
			returns.data = prop.identities;
			return returns;
		}
		else if (pack != null)
		{
			Returns returns = new Returns();
			returns.mime = "application/json; charset=utf-8";
			returns.data = pack.identities;
			return returns;
		}

		return null;
	}

	public static Returns get_data_by_path(string path)
	{
		wzpackage pack;
		wzproperty prop;
		DataSource.get_data(path, out pack, out prop);

		if (prop != null)
		{
			Returns returns = new Returns();
			returns.mime = "application/json; charset=utf-8";
			string _path;
			if (path.EndsWith("/"))
			{
				_path = path.Substring(0, path.Length - 1); ;
			}
			else
			{
				_path = path;
			}
			returns.data = new Inspector_Plain().pod(prop, _path);
			return returns;
		}
		else if (pack != null)
		{
			Returns returns = new Returns();
			returns.mime = "application/json; charset=utf-8";
			returns.data = new Inspector_Plain().pod(pack, path);
			return returns;
		}

		return null;
	}
	public static Returns get_bundle_by_path(string path)
	{
		wzpackage pack;
		wzproperty prop;

		DataSource.get_data(path, out pack, out prop);

		if (prop != null)
		{
			Returns returns = new Returns();
			returns.mime = "application/json; charset=utf-8";
			returns.data = new Inspector_Base64().pod(prop, path);
			return returns;
		}
		else if (pack != null)
		{
			Returns returns = new Returns();
			returns.mime = "application/json; charset=utf-8";
			returns.data = new Inspector_Base64().pod(pack, path);
			return returns;
		}

		return null;
	}

	public static Returns get_binary_file(string path)
	{
		wzproperty prop;
		Returns returns = new Returns();

		DataSource.get_data(path, out prop);

		if (prop != null)
		{
			var sound = prop.data as wzsound;

			returns.mime = "application/octet-stream";
			//returns.mime = "text/plain";
			//returns.mime = "text/html";
			returns.data = sound.data;

			return returns;
		}
		return null;
	}
	public static Returns _get_binary_file(string path, string mime)
	{
		wzproperty prop;
		Returns returns = new Returns();

		DataSource.get_data(path, out prop);

		if (prop != null)
		{
			var sound = prop.data as wzsound;

			returns.mime = mime;
			returns.data = sound.data;

			return returns;
		}
		return null;
	}
	public static Returns get_sound_file(string path)
	{
		wzproperty prop;
		Returns returns = new Returns();

		DataSource.get_data(path, out prop);

		if (prop != null)
		{
			var sound = prop.data as wzsound;

			//returns.ext = (sound.pcm ? ".wav" : ".mp3");
			returns.mime = (sound.pcm ? "audio/wav" : "audio/mp3");
			returns.data = sound.wave ?? sound.data;

			return returns;
		}
		return null;
	}
	public static Returns get_image_file(string path)
	{
		wzproperty prop;
		Returns returns = new Returns();

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

					returns.mime = "image/png";
					returns.data = stream.ToArray();

					return returns;
				}
			}
		}
		return null;
	}
	public static Returns get_image_gif_file(string path)
	{
		wzproperty prop;
		Returns returns = new Returns();

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

					returns.mime = "image/gif";
					returns.data = stream.ToArray();

					return returns;
				}
			}
		}
		return null;
	}

	public static Returns get_xml(string path)
	{
		Returns returns = new Returns();
		returns.mime = "text/xml; charset=utf-8";
		returns.data = (new POD_XML()).toXML(path);
		return returns;
	}

	public static Returns get_xml2(string path)
	{
		Returns returns = new Returns();
		returns.mime = "text/xml; charset=utf-8";
		returns.data = (new POD_s_XML()).toXML(path);
		return returns;
	}
}


internal class Tools
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
	public static string get_canvas_path(wzproperty property, string path)
	{
		property = inspect_canvas(property);

		if (null != property)
		{
			string link = property.query(null as string, "source") ?? property.query(null as string, "_outlink") ?? property.query(null as string, "_inlink");

			if (null == link)
			{
				return path;
			}
			else
			{
				int index = link.IndexOf(".img/");

				if (0 <= index)//outlink
				{
					return link.Substring(0, index) + link.Substring(index + 4);
				}
				else if (path != null)//inlink
				{
					var result = path.Replace(property.absolute.Replace("\0", "/"), "/" + link);

					return result;
				}
			}
		}
		return path;
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
				{
					link = link.Substring(0, index) + link.Substring(index + 4);
					DataSource.get_data(link, out target);
				}
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

internal class ObjectInspectorBase
{
	public ObjectInspectorBase()
	{
	}

	public virtual void inspect_image(wzproperty prop, string path, ICollection<KeyValuePair<string, object>> eoColl)
	{
		throw new System.NotImplementedException();
	}

	public virtual object inspect_sound(wzsound sound, string path)
	{
		throw new System.NotImplementedException();
	}

	public string get_local_path(wzproperty prop)
	{
		return prop.absolute.Replace('\0', '/').Substring(1);
	}

	public object pod_property(wzproperty prop, string path)
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
			var propName = Uri.EscapeDataString(i.identity).Replace("\\", "%5C").Replace("%", "%25");
			var p = this.pod(i, path + "/" + propName);

			eoColl.Add(new KeyValuePair<string, object>(i.identity, p));
		}
		return eo;
	}

	public object pod(wzproperty prop, string path)
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
					return "{Shape2D#Convex2D}";
				case 1: // Shape2D#Vector2D
					return new vec2(prop.data as wzvector);
				case 2: // Sound_DX8
						//if (output_canvas)
						//{
					return this.inspect_sound(prop.data as wzsound, path);
				case 3: // "Property"
					return this.pod_property(prop, path);
				case 4: // Canvas
					{
						dynamic eo = this.pod_property(prop, path);
						var eoColl = (ICollection<KeyValuePair<string, object>>)eo;

						this.inspect_image(prop, path, eoColl);

						return eo;
					}
				case 5: // UOL
					{
						var uol = prop.data as wzuol;
						var target = uol.target;
						string uol_link = path;
						if (uol_link != null)
						{
							uol_link = uol_link.Substring(0, uol_link.LastIndexOf("/"));

							foreach (string section in uol.link.Split('/'))
							{
								if (".." == section)
								{
									uol_link = uol_link.Substring(0, uol_link.LastIndexOf("/"));
								}
								else
								{
									uol_link = uol_link + "/" + section;
								}
							}
						}
						return this.pod(target, uol_link);
						//return (prop.data as wzuol).link;//need inspect
					}
				case 6: // unnamed6, zmap
					return prop.data + "";
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
			Console.WriteLine(ex.Message + "\n" + ex.StackTrace);
			return "<Error: " + ex.Message + "\n" + ex.StackTrace + ">";
		}
		return "<unknow error>";
	}
	public object pod(wzpackage pack, string path)
	{
		if (pack == null)
		{
			return null;
		}
		try
		{
			dynamic eo = new ExpandoObject();
			var eoColl = (ICollection<KeyValuePair<string, object>>)eo;

			//foreach (var id in pack.identities)
			//{
			//	var i = pack[id];
			foreach (var i in pack.values)
			{
				var p = this.pod(i, path + i.identity);

				eoColl.Add(new KeyValuePair<string, object>(i.identity, p));
			}
			return eo;
		}
		catch (Exception ex)
		{
			return "<Error: " + ex.Message + "\n" + ex.StackTrace + ">";
		}
		return "<unknow error>";
	}
}

internal class Inspector_Plain : ObjectInspectorBase
{
	public Inspector_Plain()
	{
	}

	public override void inspect_image(wzproperty prop, string path, ICollection<KeyValuePair<string, object>> eoColl)
	{
		var canvas = Tools.inspect_canvas1(prop);
		if (canvas != null)
		{
			var _path = Tools.get_canvas_path(prop, path);
			eoColl.Add(new KeyValuePair<string, object>("", "/" + _path));

			//Console.WriteLine(_path);

			eoColl.Add(new KeyValuePair<string, object>("__w", canvas.width));
			eoColl.Add(new KeyValuePair<string, object>("__h", canvas.height));
		}
		else
		{
			eoColl.Add(new KeyValuePair<string, object>("__isEmpty", true));
		}
	}

	public override object inspect_sound(wzsound sound, string path)
	{
		return path;
	}
}

internal class Inspector_Base64 : ObjectInspectorBase
{
	public Inspector_Base64()
	{
	}

	public override void inspect_image(wzproperty prop, string path, ICollection<KeyValuePair<string, object>> eoColl)
	{
		var canvas = Tools.inspect_canvas1(prop);
		if (canvas != null)
		{
			eoColl.Add(new KeyValuePair<string, object>("", Tools.ImageToBase64PNG(canvas.image)));

			eoColl.Add(new KeyValuePair<string, object>("__w", canvas.width));
			eoColl.Add(new KeyValuePair<string, object>("__h", canvas.height));
		}
		else
		{
			eoColl.Add(new KeyValuePair<string, object>("__isEmpty", true));
		}
	}

	public override object inspect_sound(wzsound sound, string path)
	{
		return Tools.BinaryToBase64String(sound.data);
	}
}

internal class POD_XML
{
	public string toXML(string link)
	{
		return this._toXML(link);
	}

	protected string _toXML(string link)
	{
		wzproperty prop;
		DataSource.get_data(link, out prop);

		try
		{
			if (prop != null)
			{
				return this._wzimgToXML(prop, link);
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
	protected string _wzimgToXML(wzproperty prop, string path)
	{
		bool is_wzpackage = path.EndsWith("/");
		string _path = (is_wzpackage ? path.Substring(0, path.Length - 1) : path);
		string raw_name = _path.Substring(_path.LastIndexOf("/") + 1) + (is_wzpackage ? ".img" : "");

		StringBuilder sb = new StringBuilder();

		sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>");

		sb.Append("<?xml-stylesheet href=\"/wzproperty.xslt\" type=\"text/xsl\" ?>");

		sb.Append("<xmldump><wzimg name=\"");
		sb.Append(raw_name);
		sb.Append("\">");

		sb.Append(this.enum_property(prop, path + "/"));

		sb.Append("</wzimg></xmldump>");

		return sb.ToString();
	}

	protected StringBuilder enum_property(wzproperty prop, string path)
	{
		StringBuilder sb = new StringBuilder();

		foreach (var sub_prop in prop.values)
		{
#if !EQUIPLIST
			if (sub_prop.identity.StartsWith("_"))
			{
				continue;
			}
#endif

			sb.Append(this.pod(sub_prop.identity, sub_prop, path));
		}
		return sb;
	}

	protected StringBuilder pod(string name, wzproperty prop, string path)
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
					sb.Append(this.ImgDir(name, prop, path));                 //return null;
					break;
				case 4: // Canvas
					sb.Append(this.Canvas(name, prop, path));			//
					break;
				case 5: // UOL
					sb.Append(this.pod(name, (prop.data as wzuol).target, path));     //return (prop.data as wzuol).link;//need inspect
					break;
				case 6: // unnamed6, zmap
					sb.Append("<" + "unnamed6" + " name=\"" + name + "\" value=\"" + (prop.data + "") + "\"/>");
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
			DataSource.writeLog("<cs Error: " + ex.Message + "\n" + ex.StackTrace + ">");
		}
		return sb;
	}

	protected virtual StringBuilder ImgDir(string name, wzproperty prop, string path)
	{
		StringBuilder sb = new StringBuilder();
		sb.Append("<imgdir name=\"");
		sb.Append(name);
		sb.Append("\">");
		sb.Append(this.enum_property(prop, path + name + "/"));
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

	protected virtual StringBuilder Canvas(string name, wzproperty prop, string path)
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
			sb.Append(this.enum_property(prop, path + "/"));
			sb.Append("</canvas>");
		}

		return sb;
	}

	protected string inspect_image(Image image)
	{
		return Convert.ToBase64String(Tools.ImageToBufferPNG(image));
	}
}

internal class POD_s_XML : POD_XML
{
	protected override StringBuilder Canvas(string name, wzproperty prop, string path)
	{
		StringBuilder sb = new StringBuilder();

		var canvas = Tools.inspect_canvas1(prop);
		if (canvas != null)
		{
			//string prop_path = prop.absolute.Replace('\0', '/');
			//var path = this.imgPath + prop_path;

			var sub_path = path + prop.identity;
			var canvas_path = Tools.get_canvas_path(prop, sub_path);

			sb.Append("<canvas name=\"");
			sb.Append(name);
			sb.Append("\" width=\"");
			sb.Append(canvas.width);
			sb.Append("\" height=\"");
			sb.Append(canvas.height);
			sb.Append("\" url=\"");
			sb.Append(canvas_path);
			sb.Append("\">");
			sb.Append(this.enum_property(prop, sub_path + "/"));
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
		this.data = null;
		this.mime = null;
	}
	public object data;
	public string mime;
}

namespace Ini
{
	internal class File
	{
		public string path;

		[DllImport("kernel32")]
		private static extern long WritePrivateProfileString(string section, string key, string val, string filePath);

		[DllImport("kernel32")]
		private static extern int GetPrivateProfileString(string section, string key, string def, StringBuilder retVal, int size, string filePath);

		public File(string INIPath)
		{
			path = Path.GetFullPath(INIPath);
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


