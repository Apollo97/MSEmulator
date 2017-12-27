using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;

public class wzpatch
{
	private Stream stream;
	private int eop; // end of wzpatch
	private int sop;

	public bool abort;

	public bool valid
	{
		get
		{
			byte[] data = new byte[12];

			if (30 < eop)
			{
				stream.Seek(-12, SeekOrigin.End);
				stream.Read(data, 0, 12);

				if (0xf2f7fbf3 == BitConverter.ToUInt32(data, 8))
				{
					int patch = BitConverter.ToInt32(data, 0);
					int notice = BitConverter.ToInt32(data, 4);

					if (2/*MZ*/ + 12 < eop - notice - patch)
					{
						eop = eop - 12 - notice;
						sop = eop - patch;
					}
				}
			}

			if (16 < eop - sop)
			{
				stream.Seek(sop, SeekOrigin.Begin);
				stream.Read(data, 0, 12);

				if (0x61507a57 == BitConverter.ToUInt32(data, 0))
					if (0x1a686374 == BitConverter.ToUInt32(data, 4))
						if (0x00000002 == BitConverter.ToUInt32(data, 8))
							return true;
			}

			return false;
		}
	}
	private delegate int process_procedure(string input, string output, string identity, bool output_temporary, int total, Stream deflate);

	public delegate void update_status_event_handler(params object[] parameters);

	public event update_status_event_handler update_status;

	public wzpatch(string location)
	{
		stream = new FileStream(location, FileMode.Open, FileAccess.Read, FileShare.Read, 0x10000, FileOptions.RandomAccess);
		eop = (int)stream.Length;
		sop = 0;
		abort = false;
	}

	public void dispose()
	{
		stream.Close();
	}

	public int prepare()
	{
		int wzplength = eop - sop - 16;
		byte[] crc = new byte[4];

	//	update_status(update_type.set_maximum, wzplength);

		stream.Seek(sop + 12, SeekOrigin.Begin);
		stream.Read(crc, 0, 4);

		if (compute_crc(stream, wzplength, 0) == BitConverter.ToUInt32(crc, 0))
		{
			DeflateStream deflate = new DeflateStream(stream, CompressionMode.Decompress);

			stream.Seek(sop + 18, SeekOrigin.Begin);

			while (!abort)
			{
				string identity = "";
				string content = "";
				int total = 0;
			_next:
				int type = deflate.ReadByte();

				if (-1 == type)
				{
					return 1;
				}
				else if (0 == type)
				{
					if (identity.EndsWith("\\"))
					{
						content = "+";
					}
					else
					{
						int length;
						uint checksum;
						byte[] data = new byte[8];

						deflate.Read(data, 0, 8);

						length = BitConverter.ToInt32(data, 0);
						checksum = BitConverter.ToUInt32(data, 4);

					//	update_status(update_type.set_maximum, length);

						if (compute_crc(deflate, length, 0) != checksum)
							break;

						content = "+ " + string.Format("OC:{0:X8},OL:{1:X8}", checksum, length);
						total = length;
					}
				}
				else if (1 == type)
				{
					uint ichecksum;
					uint ochecksum;
					int length = 0;
					byte[] data = new byte[8];

					deflate.Read(data, 0, 8);

					ichecksum = BitConverter.ToUInt32(data, 0);
					ochecksum = BitConverter.ToUInt32(data, 4);

					while (!abort)
					{
						int command;

						deflate.Read(data, 0, 4);

						command = BitConverter.ToInt32(data, 0);

						if (0 == command)
							break;

						switch (command & 0xf0000000)
						{
							case 0x80000000: command = command & 0x0fffffff; seek_stream(deflate, command); break;
							case 0xc0000000: command = (command & 0x0fffff00) >> 8; break;
							default: deflate.Read(data, 0, 4); break;
						}

						length = length + command;
					}

					content = "= " + string.Format("IC:{0:X8},OC:{1:X8},OL:{2:X8}", ichecksum, ochecksum, length);
					total = length;
				}
				else if (2 == type)
				{
					content = "-";
				}
				else
				{
					identity = identity + (char)type;

					update_status(update_type.set_content, identity);

					goto _next;
				}

				update_status(update_type.set_item, identity, content, total);
			}
		}

		return abort ? 0 : -1;
	}

	public int process(string input, string output, bool output_temporary, bool ignore_exceptions, Dictionary<string, int> length_list)
	{
		process_procedure[] procedures = { process_create, process_modify, process_remove, };

		foreach (KeyValuePair<string, int> element in length_list)
		{
			string identity = element.Key;
			Stream deflate = seek_deflate(identity);

			if (null == deflate)
			{
				break;
			}
			else
			{
				int result;
				string il = input + identity;
				string ol = output + identity;
				DateTime date = DateTime.Now;

				update_status(update_type.set_content, identity);

				Directory.CreateDirectory(Path.GetDirectoryName(il));
				Directory.CreateDirectory(Path.GetDirectoryName(ol));

				result = procedures[deflate.ReadByte()](il, ol, identity, output_temporary, element.Value, deflate);

				if (1 != result)
				{
					update_status(update_type.set_color, false, identity);

					if (abort)
						return 0;
					if (!ignore_exceptions)
						return result;
				}
				else
				{
					if (output_temporary && File.Exists(ol))
					{
						if (File.Exists(il))
							File.Delete(il);

						File.Move(ol, il);
					}

					update_status(update_type.set_color, true, identity);
				}

				update_status(update_type.set_item, (DateTime.Now - date).TotalMilliseconds / 1000.0, identity);
			}
		}

		if (output_temporary)
		{
			bool empty = 0 == Directory.GetFiles(output).Length;

			foreach (string directory in Directory.GetDirectories(output, "*", SearchOption.AllDirectories))
				if (0 < Directory.GetFiles(directory).Length)
					empty = false;

			if (empty)
				Directory.Delete(output, true);
		}

		return abort ? 0 : 1;
	}

	private Stream seek_deflate(string target)
	{
		DeflateStream deflate = new DeflateStream(stream, CompressionMode.Decompress);

		stream.Seek(sop + 18, SeekOrigin.Begin);

		while (!abort)
		{
			string identity = "";
		_next:
			int type = deflate.ReadByte();

			if (-1 == type)
			{
				return null;
			}
			else if (0 == type)
			{
				if (!identity.EndsWith("\\"))
				{
					byte[] data = new byte[8];

					deflate.Read(data, 0, 8);

					seek_stream(deflate, BitConverter.ToInt32(data, 0));
				}
			}
			else if (1 == type)
			{
				byte[] data = new byte[8];

				deflate.Read(data, 0, 8);

				while (!abort)
				{
					int command;

					deflate.Read(data, 0, 4);

					command = BitConverter.ToInt32(data, 0);

					if (0 == command)
						break;

					switch (command & 0xf0000000)
					{
						case 0x80000000: seek_stream(deflate, command & 0x0fffffff); break;
						case 0xc0000000: break;
						default: deflate.Read(data, 0, 4); break;
					}
				}
			}
			else if (2 == type)
			{
			}
			else
			{
				identity = identity + (char)type;

				if (target == identity)
					return deflate;

				goto _next;
			}
		}

		return null;
	}

	private int process_create(string input, string output, string identity, bool output_temporary, int total, Stream deflate)
	{
		update_status(update_type.set_content, "[1/1]" + identity);

		if (identity.EndsWith("\\"))
		{
			Directory.CreateDirectory(output);
		}
		else
		{
			uint crc = 0;
			byte[] info = new byte[8];

			deflate.Read(info, 0, 8);

			using (Stream ostream = new FileStream(output, FileMode.Create, FileAccess.Write, FileShare.None, 0x10000))
				write_block(deflate, ostream, BitConverter.ToInt32(info, 0), ref crc);

			if (crc != BitConverter.ToUInt32(info, 4))
				return -1;
		}

		return 1;
	}

	private int process_modify(string input, string output, string identity, bool output_temporary, int total, Stream deflate)
	{
		if (File.Exists(input))
			using (Stream istream = new FileStream(input, FileMode.Open, FileAccess.Read, FileShare.Read, 0x10000, FileOptions.RandomAccess))
			{
				byte[] info = new byte[8];

				deflate.Read(info, 0, 8);

				update_status(update_type.set_content, "[1/2]" + identity);
			//	update_status(update_type.set_maximum, (int)istream.Length);

				if (compute_crc(istream, (int)istream.Length, 0) == BitConverter.ToUInt32(info, 0))
				{
					uint crc = 0;

					update_status(update_type.set_content, "[2/2]" + identity);

					using (Stream ostream = new FileStream(output, FileMode.Create, FileAccess.Write, FileShare.None, 0x10000))
					{
						istream.Seek(0, SeekOrigin.Begin);
						ostream.SetLength(total);

						while (!abort)
						{
							int command;
							byte[] cmd = new byte[4];

							deflate.Read(cmd, 0, 4);

							command = BitConverter.ToInt32(cmd, 0);

							if (0 == command)
								break;

							if (0x80000000 == (command & 0xf0000000))
							{
								write_block(deflate, ostream, command & 0x0fffffff, ref crc);
							}
							else if (0xc0000000 == (command & 0xf0000000))
							{
								int length = (command & 0x0fffff00) >> 8;
								byte value = (byte)(command & 0xff);
								byte[] block = new byte[length];

								for (int index = 0; index < length; ++index)
									block[index] = value;

								ostream.Write(block, 0, length);

								checksum32.process(block, ref crc);

							//	update_status(update_type.set_progress, length);
							}
							else
							{
								deflate.Read(cmd, 0, 4);

								istream.Seek(BitConverter.ToInt32(cmd, 0), SeekOrigin.Begin);

								write_block(istream, ostream, command, ref crc);
							}
						}
					}

					return crc == BitConverter.ToUInt32(info, 4) ? 1 : -1;
				}
			}

		return 2;
	}

	private int process_remove(string input, string output, string identity, bool output_temporary, int total, Stream deflate)
	{
		update_status(update_type.set_content, "[1/1]" + identity);

		/* Directory/File.Delete(input) */

		return 1;
	}

	private uint compute_crc(Stream stream, int total, uint crc)
	{
		for (int length = 0; !abort && length < total; )
		{
			int block = 0x200000 > total - length ? total - length : 0x200000;
			byte[] data = new byte[block];

			stream.Read(data, 0, block);

			checksum32.process(data, ref crc);

		//	update_status(update_type.set_progress, block);

			length = length + block;
		}

		return crc;
	}

	private void seek_stream(Stream input, int total)
	{
		for (int length = 0; !abort && length < total; )
		{
			int block = 0x200000 > total - length ? total - length : 0x200000;
			byte[] data = new byte[block];

			input.Read(data, 0, block);

			length = length + block;
		}
	}

	private void write_block(Stream input, Stream output, int total, ref uint crc)
	{
		for (int length = 0; !abort && length < total; )
		{
			int block = 0x200000 > total - length ? total - length : 0x200000;
			byte[] data = new byte[block];

			input.Read(data, 0, block);
			output.Write(data, 0, block);

			checksum32.process(data, ref crc);

		//	update_status(update_type.set_progress, block);

			length = length + block;
		}
	}

	private static class checksum32
	{
		private static uint[] table;

		static checksum32()
		{
			table = new uint[256];

			for (int i = 0; i < 256; ++i)
			{
				uint e = 0;

				for (int j = 0, c = i << 24; j < 8; ++j, c = c << 1)
					if (0 == ((c ^ e) & 0x80000000))
						e = e << 1;
					else
						e = (e << 1) ^ 0x04c11db7;

				table[i] = e;
			}
		}

		unsafe internal static void process(byte[] data, ref uint crc)
		{
			fixed (byte* ptr = data)
				for (int index = 0; index < data.Length; ++index)
					crc = table[ptr[index] ^ (crc >> 24)] ^ (crc << 8);
		}
	}

	public enum update_type
	{
		set_maximum = 0,
		set_progress,
		set_content,
		set_item,
		set_color,
	}
}
