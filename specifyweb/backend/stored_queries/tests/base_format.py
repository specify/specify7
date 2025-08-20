SIMPLE_DEF = """
        <formatters>
          <format
            name="Accession"
            title="Accession"
            class="edu.ku.brc.specify.datamodel.Accession"
            default="true"
          >
            <switch single="true">
              <fields>
                <field>accessionNumber</field>
              </fields>
            </switch>
          </format>
          <format
            name="AccessionAgent"
            title="AccessionAgent"
            class="edu.ku.brc.specify.datamodel.AccessionAgent"
            default="true"
          >
            <switch single="true">
              <fields>
                <field formatter="Agent">agent</field>
                <field sep=" - ">role</field>
              </fields>
            </switch>
          </format>
          <format
            name="Agent"
            title="Agent"
            class="edu.ku.brc.specify.datamodel.Agent"
            default="true"
          >
            <switch single="false" field="agentType">
              <fields value="0">
                <field>lastName</field>
              </fields>
              <fields value="1">
                <field>lastName</field>
                <field sep=", ">firstName</field>
                <field sep=" ">middleInitial</field>
              </fields>
              <fields value="2">
                <field>lastName</field>
              </fields>
              <fields value="3">
                <field>lastName</field>
              </fields>
            </switch>
          </format>

        <format
            name="CollectingEvent"
            title="CollectingEvent"
            class="edu.ku.brc.specify.datamodel.CollectingEvent"
            default="true"
            >
            <switch single="true">
                <fields>
                    <field>stationFieldNumber</field>
                    <field sep=": ">startDate</field>
                    <field sep=": ">locality.geography.fullName</field>
                    <field sep=": ">locality.localityName</field>
                    <field type="bigdecimal" sep=", ">locality.latitude1</field>
                    <field type="bigdecimal" sep=", ">locality.longitude1</field>
                </fields>
            </switch>
        </format>
        <aggregators>
        <aggregator
          name="AccessionAgent"
          title="AccessionAgent"
          class="edu.ku.brc.specify.datamodel.AccessionAgent"
          default="true"
          separator="; "
          ending=""
          count="9"
          format="AccessionAgent"
          orderfieldname=""
        />
        </aggregators>
        </formatters>
                        """