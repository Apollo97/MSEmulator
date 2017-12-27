<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  
  <xsl:template match="/">
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="/xmldump/wzimg/@name"/></title>
        <style>
          table {
            border-collapse:collapse;
          }
          tr:hover {
            /*border-bottom: 1px solid black;*/
            background: rgba(16,192,255,0.12);
          }/*
          .property th, td {
            border: 1px solid black;
          }
          .canvas {
            border-bottom: 1px solid black;
          }*/
          .canvas span {
            padding-right: 1em;
          }
          .canvas img {
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <xsl:apply-templates select="xmldump/wzimg"/>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="xmldump/wzimg">
    <h2>
      <xsl:value-of select="@name"/>
    </h2>
    <xsl:apply-templates/>
  </xsl:template>

  <xsl:template match="imgdir">
    <table border="1">
      <tr>
        <th>Name</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>
          <xsl:value-of select="@name"/>
        </td>
        <td>
          <xsl:apply-templates select="canvas"/>
          <xsl:apply-templates select="vector"/>
          <xsl:apply-templates select="string"/>
          <xsl:apply-templates select="int"/>
          
          <xsl:for-each select="imgdir">
            <table class="property">
              <tr>
                <th>Name</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>
                  <xsl:value-of select="@name"/>
                </td>
                <td>
                  <xsl:apply-templates select="canvas"/>
                  <xsl:apply-templates select="vector"/>
                  <xsl:apply-templates select="string"/>
                  <xsl:apply-templates select="int"/>
                  <xsl:for-each select="imgdir">
                    <xsl:apply-templates/>
                  </xsl:for-each>
                </td>
              </tr>
            </table>
          </xsl:for-each>
        </td>
      </tr>
    </table>
  </xsl:template>

  <xsl:template match="string">
    <div title="string">
      <xsl:value-of select="@name"/>: 
      <xsl:value-of select="@value" />
    </div>
  </xsl:template>

  <xsl:template match="int">
    <div title="int">
      <xsl:value-of select="@name"/>: 
      <xsl:value-of select="@value" />
    </div>
  </xsl:template>
  
  <xsl:template match="vector">
    <div title="vector">
      <xsl:value-of select="@name"/>: 
      (<xsl:value-of select="@x" />, <xsl:value-of select="@y" />)
    </div>
  </xsl:template>
  
  <xsl:template match="canvas">
    <div class="canvas" title="canvas">      
      <table>
        <tr>
          <th><xsl:value-of select="@name"/></th>
          <th>
            <img>
              <xsl:attribute name="width">
                <xsl:value-of select="@width" />
              </xsl:attribute>
              <xsl:attribute name="height">
                <xsl:value-of select="@height" />
              </xsl:attribute>
			  
              <xsl:apply-templates select="@basedata"/>
              <xsl:apply-templates select="@url"/>
			  
            </img>
          </th>
        </tr>
        <xsl:for-each select=".">
          <tr>
            <td></td>
            <td>
              <xsl:apply-templates/>
            </td>
          </tr>
        </xsl:for-each>
      </table>
    </div>
  </xsl:template>
  
  <xsl:template match="canvas/@basedata">
	<xsl:attribute name="src">
		data:image/png;base64,<xsl:value-of select="." />
	</xsl:attribute>
  </xsl:template>
  
  <xsl:template match="canvas/@url">
	<xsl:attribute name="src">
	  /images/<xsl:value-of select="." />
	</xsl:attribute>
  </xsl:template>

</xsl:stylesheet>
