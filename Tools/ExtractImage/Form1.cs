using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ExtractImage
{
	public partial class Form1 : Form
	{
		public ExtractImage m_inspect = null;

		public Form1()
		{
			InitializeComponent();

			this.textBox1.Text = @"Q:\Program Files\MapleStory_203";

			this.textBox3.Text = @"Etc/BossLucid.img/Dragon";
		}

		private void button2_Click(object sender, EventArgs e)
		{
			if (this.backgroundWorker1.IsBusy)
			{
				return;
			}
			if (!String.IsNullOrEmpty(this.textBox1.Text) && !String.IsNullOrEmpty(this.textBox3.Text))
			{
				try
				{
					if (this.m_inspect == null || this.m_inspect.archives.location != this.textBox1.Text)
					{
						this.progressBar1.Value = 0;
						this.button2.Enabled = false;

						this.backgroundWorker1.RunWorkerAsync(new ExtractArgs(null, this.textBox1.Text, this.textBox3.Text));
					}
				}
				catch (Exception)
				{
					System.Windows.Forms.MessageBox.Show("Not found base.wz\n" + this.textBox1.Text);
				}
			}
		}

		private void backgroundWorker1_DoWork(object sender, DoWorkEventArgs e)
		{
			var args = (ExtractArgs)e.Argument;
			var result = new ExtractResult();

			e.Result = result;

			this.m_inspect = new ExtractImage();
			this.m_inspect.worker = this.backgroundWorker1;

			if (this.m_inspect.Load(args.archives_path))
			{
				//try
				//{
					this.m_inspect.ExtractAllImage(args.output_path, args.data_path);

					result.success = true;
				//}
				//catch (Exception ex)
				//{
				//	throw ex;
				//}
			}
		}

		private void backgroundWorker1_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e)
		{
			this.button2.Enabled = true;
		}

		private void backgroundWorker1_ProgressChanged(object sender, ProgressChangedEventArgs e)
		{
			this.progressBar1.Value = e.ProgressPercentage;
		}
	}

	class ExtractArgs
	{
		public string output_path, archives_path, data_path;

		internal ExtractArgs(string output_path, string archives_path, string data_path)
		{
			this.output_path = output_path;
			this.archives_path = archives_path;
			this.data_path = data_path;
		}
	}
	class ExtractResult
	{
		public bool success = false;

		internal ExtractResult()
		{
		}
	}
}
