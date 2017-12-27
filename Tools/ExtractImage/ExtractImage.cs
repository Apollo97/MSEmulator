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
	public class ExtractImage : MInspect
	{
		System.Collections.Stack images = new System.Collections.Stack();
		public System.ComponentModel.BackgroundWorker worker = null;

		public ExtractImage()
		{
		}

		public void ExtractAllImage(string output_path, string data_path)
		{
			var pb = _getPropertyByLink(data_path);
			var name = (string)pb[0];
			var prop = (wzproperty)pb[1];

			this.pod(name, prop, data_path);

			var imgs = images.ToArray();
			var length = images.Count;

			for (var i = 0; i < imgs.Length; ++i)
			{
				var pair = (object[])imgs[i];
				var path = (string)pair[0];
				var canvas = (wzcanvas)pair[1];

				canvas.image.Save(path, System.Drawing.Imaging.ImageFormat.Png);

				if (this.worker != null) {
					this.worker.ReportProgress((int)((i + 1) * 100 / (float)length));
				}
			}
		}

		protected object[] _getPropertyByLink(string link)
		{
			string name = null;
			wzproperty prop = null;

			try
			{
				if (link.EndsWith(".img"))
				{
					var paths = link.Split('/');
					name = paths[paths.Length - 1];
					prop = this.packages[paths].root[""];

					return new object[] {
						name, prop
					};
				}
				else if (link.EndsWith(".img/"))
				{
					var paths = link.Substring(0, link.Length - 1).Split('/');
					name = paths[paths.Length - 1];
					prop = this.packages[paths].root[""];

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
						return new object[] {
						ns[ns.Length - 1], this.get_data(link)
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

		protected void pod(string name, wzproperty prop, string current_path)
		{
			if (prop == null)
			{
				return;
			}
			try
			{
				var type = prop.type;
				switch (type)
				{
					case 3: // "Property"
						this.enum_property(prop, current_path);
						break;
					case 4: // Canvas
						this.Canvas(prop, current_path);
						break;
					case 5: // UOL
						this.pod(name, (prop.data as wzuol).target, current_path);
						break;
				}
			}
			catch (Exception ex)
			{
				Console.Write("<cs Error: " + ex.Message + "\n" + ex.StackTrace + ">");
			}
		}

		protected virtual void Canvas(wzproperty prop, string current_path)
		{
			var canvas = this.inspect_canvas1(prop);
			if (canvas != null)
			{
				images.Push(new object[] { current_path, canvas });

				//don't use current_path create directory
				//this.enum_property(prop, current_path);
			}
		}

		protected void enum_property(wzproperty prop, string current_path)
		{
			System.IO.Directory.CreateDirectory(current_path);

			foreach (var i in prop.values)
			{
				//if (i.identity.StartsWith("_"))
				//{
				//	continue;
				//}

				this.pod(i.identity, i, current_path + "/" + i.identity);
			}
		}
	}
}
