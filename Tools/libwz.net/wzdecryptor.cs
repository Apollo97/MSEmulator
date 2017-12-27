using System.IO;
using System.Security.Cryptography;
using System.Text;

internal class wzdecryptor
{
	private static readonly byte[] factork = { 0xB9, 0x7D, 0x63, 0xE9, };
	private static readonly byte[] factorg = { 0x4D, 0x23, 0xC7, 0x2B, };
	private static readonly byte[] key =
	{
		0x13, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00,
		0x06, 0x00, 0x00, 0x00, 0xB4, 0x00, 0x00, 0x00,
		0x1B, 0x00, 0x00, 0x00, 0x0F, 0x00, 0x00, 0x00,
		0x33, 0x00, 0x00, 0x00, 0x52, 0x00, 0x00, 0x00,
	};

	private byte[] cryptok;
	private byte[] cryptog;
	private byte[] cryptox;
	private byte[] cryptoc;

	internal char region
	{
		private get { return cryptok == cryptoc ? 'k' : cryptog == cryptoc ? 'g' : 'x'; }
		set { cryptoc = 'k' == value ? cryptok : 'g' == value ? cryptog : cryptox; }
	}

	protected wzdecryptor()
	{
		cryptok = construct_sequence(0xffff, factork);
		cryptog = construct_sequence(0xffff, factorg);
		cryptox = new byte[0xffff];
		cryptoc = cryptok;
	}

	private byte[] construct_sequence(int length, byte[] factor)
	{
		using (Rijndael rijndael = Rijndael.Create())
		{
			rijndael.Key = key;
			rijndael.Mode = CipherMode.ECB;

			using (MemoryStream stream = new MemoryStream())
			{
				CryptoStream crypto = new CryptoStream(stream, rijndael.CreateEncryptor(), CryptoStreamMode.Write);
				int size = 4 * factor.Length;
				byte[] transform = new byte[size];

				for (int index = 0; index < 4; ++index)
					factor.CopyTo(transform, factor.Length * index);

				for (int index = length / size + length % size % 2; index > 0; --index)
				{
					crypto.Write(transform, 0, size);
					stream.Seek(-size, SeekOrigin.Current);
					stream.Read(transform, 0, size);
				}

				stream.SetLength(length);

				return stream.ToArray();
			}
		}
	}

	private byte[] construct_sequence(int length)
	{
		byte[] factor;

		switch (region)
		{
			case 'k': factor = factork; break;
			case 'g': factor = factorg; break;
			default: return new byte[length];
		}

		return construct_sequence(length, factor);
	}

	protected string decrypt_string(byte[] bytes)
	{
		byte[] crypto = bytes.Length > cryptoc.Length ? construct_sequence(bytes.Length) : cryptoc;
		byte factor = 0xaa;

		for (int index = 0; index < bytes.Length; ++index, ++factor)
			bytes[index] = (byte)(bytes[index] ^ crypto[index] ^ factor);

		return Encoding.ASCII.GetString(bytes);
	}

	protected string decrypt_string16(byte[] bytes)
	{
		byte[] crypto = bytes.Length > cryptoc.Length ? construct_sequence(bytes.Length) : cryptoc;
		ushort factor = 0xaaaa;

		for (int index = 0; index < bytes.Length; index = index + 2, ++factor)
		{
			bytes[index] = (byte)(bytes[index] ^ crypto[index] ^ (factor & 0xff));
			bytes[index + 1] = (byte)(bytes[index + 1] ^ crypto[index + 1] ^ (factor >> 0x08));
		}

		return Encoding.Unicode.GetString(bytes);
	}

	internal byte[] decrypt_bytes(byte[] bytes)
	{
		byte[] crypto = bytes.Length > cryptoc.Length ? construct_sequence(bytes.Length) : cryptoc;

		for (int index = 0; index < bytes.Length; ++index)
			bytes[index] = (byte)(bytes[index] ^ crypto[index]);

		return bytes;
	}
}
