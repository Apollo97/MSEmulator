using System.Collections.Generic;
using System.IO;

public class wzarchives
{
	private string input;
	private wzpackage packages;
	private List<wzarchive> archives;

	public string location
	{
		get
		{
			return input;
		}
	}

	public wzpackage root
	{
		get
		{
			return packages;
		}
	}

	public int[] versions
	{
		get
		{
			return archives[0].versions;
		}
	}

	public int version
	{
		get
		{
			return archives[0].version;
		}
	}

	public wzarchives(string location)
	{
		wzarchive archive = new wzarchive(location);
		wzpackage root = archive.root;

		input = location;
		packages = root;
		archives = new List<wzarchive> { archive, };

		if (null != root)
		{
			string prefix = Path.GetDirectoryName(location) + "\\";
			string[] fmts = new string[] { "0", "000" };

			foreach (wzpackage element in root)
				if (0 != element.type % 2 && 0 == element.count)
				{
					for (var i = 0; i < 2; ++i)
					{
						for (var j = 0; j < fmts.Length; ++j)
						{
							var num = i == 0 ? "" : (j == 0 ? (i + 1) : i).ToString(fmts[j]);

							location = prefix + element.identity + num  + ".wz";

							if (File.Exists(location))
							{
								archive = new wzarchive(location);
								root = archive.root;

								if (null != root)
								{
									foreach (wzpackage package in root)
									{
										package.parent = element;

										element.append(package.identity, package);
									}

									archives.Add(archive);
									if (i > 0)
									{
										this.root[element.identity].merge(root);
									}

									break;//Map001.wz or Map2.wz
								}
							}
						}
					}
				}
		}
	}

	public void dispose()
	{
		foreach (wzarchive archive in archives)
			archive.dispose();
	}
}

internal class wzarchive
{
	private wzreader reader;
	private wzheader header;

	internal int[] versions
	{
		get
		{
			return header.versions;
		}
	}

	internal int version
	{
		get
		{
			return header.version;
		}
	}

	internal wzpackage root
	{
		get
		{
			if (header.valid)
				if (probe_region())
				{
					reader.position = header.size + 2;
					header.eod = compute_eod();
					reader.position = header.size + 2;

					return expand(new wzpackage(null, 0, 0, 0, 0, null, null));
				}

			dispose();

			return null;
		}
	}

	internal wzarchive(string location)
	{
		reader = new wzreader(location);
		header = new wzheader(reader);
	}

	internal void dispose()
	{
		reader.dispose();
	}

	private bool probe_region()
	{
		foreach (char region in new[] { 'k', 'g', 'x', })
		{
			reader.position = header.size + 2;
			reader.region = region;

			if (query_identity().EndsWith(".img"))
				return true;
		}

		return false;
	}

	private string query_identity()
	{
		int children = 0;

		for (int count = reader.unpack<int>(); count > 0; --count)
		{
			switch (reader.read<byte>())
			{
				case 1: reader.decrypt_string(header.size + 1 + reader.read<int>()); ++children; break;
				case 2: return reader.decrypt_string(header.size + 1 + reader.read<int>());
				case 3: reader.decrypt_string(); ++children; break;
				case 4: return reader.decrypt_string();
				default: return null;
			}

			reader.unpack<int>();
			reader.unpack<int>();
			reader.read<int>();
		}

		while (0 < children--)
		{
			string identity = query_identity();

			if (null != identity)
				return identity;
		}

		return null;
	}

	private int compute_eod()
	{
		int children = 0;

		for (int count = reader.unpack<int>(); count > 0; --count)
		{
			switch (reader.read<byte>())
			{
				case 1: reader.decrypt_string(header.size + 1 + reader.read<int>()); ++children; break;
				case 2: reader.decrypt_string(header.size + 1 + reader.read<int>()); break;
				case 3: reader.decrypt_string(); ++children; break;
				case 4: reader.decrypt_string(); break;
				default: return 0;
			}

			reader.unpack<int>();
			reader.unpack<int>();
			reader.read<int>();
		}

		while (0 < children--)
			compute_eod();

		return reader.position;
	}

	private wzpackage expand(wzpackage host)
	{
		for (int count = reader.unpack<int>(); count > 0; --count)
		{
			string identity;
			byte type = reader.read<byte>();

			switch (type)
			{
				case 1:
				case 2: identity = reader.decrypt_string(header.size + 1 + reader.read<int>()); break;
				case 3:
				case 4: identity = reader.decrypt_string(); break;
				default: return null;
			}

			host.append(identity, new wzpackage(identity, type, reader.unpack<int>(), reader.unpack<int>(), header.compute_offset(), host, reader));
		}

		foreach (wzpackage package in host)
			if (0 != package.type % 2)
				if (null == expand(package))
					return null;

		return host;
	}
}
