
var React = require('react');
var sprintf = require('sprintf');
var moment = require('moment');

var Inputs = require('lucify-commons/src/js/components/inputs.jsx');
var DividedCols = require('lucify-commons/src/js/components/divided-cols.jsx');
var FormRow = require('lucify-commons/src/js/components/nice-form-row.jsx');
var lucifyUtils = require('lucify-commons/src/js/lucify-utils.jsx');
var ComponentWidthMixin = require('lucify-commons/src/js/components/container-width-mixin.js');

var RefugeeMap = require('./responsive-refugee-map.jsx');
var TimeLayer = require('./refugee-map-time-layer.jsx');
var refugeeConstants = require('../../model/refugee-constants.js');
var RefugeeTimeRangeIndicator = require('./refugee-time-range-indicator.jsx');

var RefugeesBarCharts = require('./refugees-bar-charts.jsx');
var RefugeeHighlightMixin = require('./refugee-highlight-mixin.js');

var Tabs = require('react-simpletabs');


var RefugeeMapSegment = React.createClass({


  mixins: [ComponentWidthMixin, RefugeeHighlightMixin],


  getInitialState: function() {
    return {
      timeRange: [
        // use startOf('month') for the beginning month and endOf('month') for the last
        moment([2015, 0]).startOf('month').unix(),
        moment([2015, 10]).endOf('month').unix()
      ]
    };
  },


  getTimeRange: function() {
    return this.state.timeRange;
  },


  handleTimeRangeChange: function(newTimeRange) {
    this.setState({timeRange: newTimeRange});
  },


  interactionsEnabled: function() {
    return !lucifyUtils.isSlowDevice();
  },


  getCountsInstruction: function() {
    if (refugeeConstants.labelShowBreakPoint < this.componentWidth) {
      return (
        <span>
          The counts shown on hover represent the number
          of people who have left or arrived in a country
          during the selected time period.
        </span>
      );
    }
    return null;
  },


  getInteractionsInstruction: function() {
    if (this.interactionsEnabled() && false) {
      return (
        <div>
          <p className="first">
            Hover over countries to
            show details. Click on a country to
            lock the selection.
            {' '}{this.getCountsInstruction()}
          </p>

          <p className="last">
            The line chart displays the total rate of
            asylum seekers over time. Drag over the chart
            to change the selected time period.
          </p>
        </div>
      );
    } else {
      return (
        <div>
          <p className="first">
            Osoita hiirellä maata nähdäksesi maata koskevia lisätietoja.
            Klikkaa maata lukitaksesi valinnan.
          </p>

          <p className="last">
            Valitun maan päällä oleva numero vastaa joko
            maahan jätettyjen tai maasta peräisin olevien
            hakemusten määrää valittuna ajanjaksona.
            Valitessasi maan näet myös eri maista tulleiden ja
            eri maihin jätettyjen hakemusten määrät.
          </p>
        </div>
      );
    }
  },


  render: function() {
    return (
      <div className="refugee-map-segment">
        <Inputs>
          <div className="lucify-container">
            <DividedCols
              first={
                <div className="inputs__instructions">
                  <p className="first">
                    Tällä työkalulla voit tarkastella
                    eri näkökulmista Euroopan valtioihin
                    tehtyjen turvapaikkahakemusten määrää.
                    Luvut perustuvat UNHCR:n koostamiin tilastoihin.
                  </p>

                  <p className="last">
                      Valitse hiirellä vetämällä kuvaajasta ajanjakso,
                      jota haluat tarkastella. Huomaa, että voit myös
                      muuttaa ajanjakson pituutta.
                  </p>
                </div>
              }
              second={
                <div className="inputs__instructions">
                  {this.getInteractionsInstruction()}
                </div>
              } />
          </div>
        </Inputs>

        <TimeLayer
          country={this.getHighlightedCountry()}
          ref="time"
          width={this.componentWidth}
          onTimeRangeChange={this.handleTimeRangeChange}
          timeRange={this.state.timeRange}
          refugeeCountsModel={this.props.refugeeCountsModel}
          countryFigures={this.props.countryFigures}
          mapModel={this.props.mapModel} />

        <div className="refugee-map-segment__tabs">
          <Tabs>
              <Tabs.Panel title="Euroopan kartta">
                <RefugeeMap ref="rmap"
                  {...this.props}
                  {...this.getHighlightLayerParams()}
                  onMouseOver={this.handleMouseOver}
                  onMouseLeave={this.handleMouseLeave}
                  onMapClick={this.handleMapClick}
                  lo={22.2206322 - 9}
                  la={34.0485818 + 15}
                  scale={1.4}
                  timeRange={this.state.timeRange}
                  interactionsEnabled={this.interactionsEnabled()} />
              </Tabs.Panel>
              <Tabs.Panel title="Euroopan ja lähtömaiden kartta">
                  <RefugeeMap ref="rmap"
                    {...this.props}
                    {...this.getHighlightLayerParams()}
                    onMouseOver={this.handleMouseOver}
                    onMouseLeave={this.handleMouseLeave}
                    onMapClick={this.handleMapClick}
                    timeRange={this.state.timeRange}
                    interactionsEnabled={this.interactionsEnabled()} />
              </Tabs.Panel>

              <Tabs.Panel title="Pylväskaaviona">
                <RefugeesBarCharts {...this.props}
                  timeRange={this.state.timeRange} />
              </Tabs.Panel>
          </Tabs>
          <RefugeeTimeRangeIndicator timeRange={this.state.timeRange} />
        </div>

      </div>
    );
  }

});



module.exports = RefugeeMapSegment;
