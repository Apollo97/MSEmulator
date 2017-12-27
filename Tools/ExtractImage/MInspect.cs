using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

namespace ExtractImage
{
	public class MInspect
	{
		//public static Stopwatch stopwatch = new Stopwatch();

		public wzarchives archives = null;
		public wzpackage packages = null;

		public MInspect()
		{
		}

		public bool Load(string location)
		{
			string path = location + "\\" + "base.wz";

			if (System.IO.File.Exists(path))
			{
				this.archives = new wzarchives(location + "\\" + "base.wz");
				this.packages = archives.root;
				return true;
			}
			//System.Windows.Forms.MessageBox.Show("version: " + MInspect.archives.version, "version");
			return false;
		}

		static public void _SavePNG(Image image, System.IO.Stream stream)
		{
			image.Save(stream, ImageFormat.Png);
			stream.Position = 0;
		}
		static public byte[] ImageToBufferPNG(Image image)
		{
			using (MemoryStream stream = new MemoryStream())
			{
				MInspect._SavePNG(image, stream);
				return stream.ToArray();
			}
		}
		static public string ImageToBase64PNG(Image image)
		{
			//stopwatch.Start();

			string binStr = Convert.ToBase64String(MInspect.ImageToBufferPNG(image));

			//stopwatch.Stop();

			return "data:image/png;base64," + binStr;
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
		public wzproperty _inspect_canvas1(wzproperty property)
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
						target = (wzproperty)this.get_data(link);
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
		public wzcanvas inspect_canvas1(wzproperty property)
		{
			property = this._inspect_canvas1(property);

			if (null != property)
			{
				wzcanvas source;

				source = property.query<wzcanvas>(null);

				return source;
			}

			return null;
		}

		public static wzproperty _get_property(wzproperty property, string[] link, int step)
		{
			if (link.Length == step)
			{
				return property;
			}

			var name = link[step];

			var sub_property = property[name];

			if (property.type == 5)// UOL
			{
				return _get_property((property.data as wzuol).target, link, step);
			}
			if (sub_property != null)
			{
				return _get_property(sub_property, link, step + 1);
			}

			return null;
		}

		public object get_data(string link)
		{
			object data;

			try
			{
				data = this._get_data(link);
			}
			catch (Exception)
			{
				try
				{
					var p = link.Split('/');
					p[0] += "2";
					link = String.Join("/", p);
					data = this._get_data(link);

					//System.Windows.Forms.MessageBox.Show(link, "2");
				}
				catch (Exception ex)
				{
					data = null;
					//System.Windows.Forms.MessageBox.Show(link + "\n" + ex.Message + "\n" + ex.StackTrace);
					Console.WriteLine("Can not get: " + link);
					Console.WriteLine(" ? " + ex.Message);
					Console.WriteLine(" ? " + ex.StackTrace);
				}
			}

			return data;
		}

		public object _get_data(string link)
		{
			int index = link.IndexOf(".img/");

			if (0 <= index)
			{
				if (!link.EndsWith(".img/"))
				{
					return _get_property(this.packages[link.Substring(0, index + 4).Split('/')].root[""], link.Substring(index + 5).Split('/'), 0);
					//return MInspect.packages[link.Substring(0, index + 4).Split('/')].root[""][link.Substring(index + 5).Split('/')];
				}
				else
				{
					try
					{
						return this.packages[link.Substring(0, index + 4).Split('/')].root[""];
					}
					catch (Exception)
					{
						return this.packages[link.Substring(0, index + 4).Split('/')];
					}
				}
			}
			else
				return this.packages[link.Split('/')];

			return null;
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
}
