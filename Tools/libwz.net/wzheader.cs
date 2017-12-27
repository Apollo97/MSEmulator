
internal class wzheader
{
	private object[] properties;

	internal int eod // end of directory
	{
		get
		{
			return (int)properties[0];
		}
		set
		{
			properties[0] = value;
		}
	}

	private wzreader reader
	{
		get
		{
			return properties[1] as wzreader;
		}
	}

	internal int size
	{
		get
		{
			return (int)properties[2];
		}
		private set
		{
			properties[2] = value;
		}
	}

	internal int[] versions
	{
		get
		{
			return properties[3] as int[];
		}
	}

	private uint[] factors
	{
		get
		{
			return properties[4] as uint[];
		}
	}

	private int conclusion
	{
		get
		{
			return (int)properties[5];
		}
		set
		{
			properties[5] = value;
		}
	}

	internal int version
	{
		get
		{
			return versions[conclusion];
		}
	}

	internal bool valid
	{
		get
		{
			if (64 <= reader.length)
			{
				int singnature = reader.read<int>();
				long datasize = reader.read<long>();
				int headersize = reader.read<int>();
				byte[] copyright = reader.read_bytes(44);
				ushort versionhash = reader.read<ushort>();

				if (0x31474b50 == singnature && reader.length == datasize + headersize)
				{
					for (int version = 0, index = 0; index < 10; ++version)
					{
						uint factor = 0;

						foreach (char element in version.ToString())
							factor = (factor * 32) + element + 1;

						if (((((0xff ^
							((factor >> 0x18) & 0xff)) ^
							((factor >> 0x10) & 0xff)) ^
							((factor >> 0x08) & 0xff)) ^
							((factor >> 0x00) & 0xff)) == versionhash)
						{
							versions[index] = version;
							factors[index] = factor;

							++index;
						}
					}

					size = headersize;

					return true;
				}
			}

			return false;
		}
	}

	internal wzheader(wzreader reader)
	{
		properties = new object[]
		{
			0,
			reader,
			0,
			new int[10],
			new uint[10],
			-1,
		};
	}

	internal int compute_offset()
	{
		uint value = reader.read<uint>();
		uint offset = (uint)(reader.position - size - 4) ^ 0xffffffff;

		if (-1 < conclusion)
			offset = compute_offset(offset, factors[conclusion], value);
		else
			for (int index = 0; index < 10; ++index)
			{
				uint position = compute_offset(offset, factors[index], value);

				if (eod == position)
				{
					offset = position;
					conclusion = index;

					break;
				}
			}

		return (int)offset;
	}

	private uint compute_offset(uint offset, uint factor, uint value)
	{
		offset = offset * factor - 0x581c3f6d;
		factor = offset & 0x1f;

		return (((offset << (int)factor) | (offset >> (0x20 - (int)factor))) ^ value) + 0x78;
	}
}
