
var React = require('react');
var d3 = require('d3');
var moment = require('moment');
var classNames = require('classnames');
var _ = require('underscore');
var sprintf = require('sprintf');
var console = require("console-browserify");

var legend = require('d3-svg-legend/no-extend');
var approx = require('approximate-number');

// the d3-svg-legend components for some
// reason seems to need a global d3
window.d3 = d3;

var getFullCount = function(counts) {
  if (!counts) {
    return 0;
  }

  return counts.asylumApplications;
};

var zeroColor = 'rgb(255,255,255)';

var choroplethColors = [
  'rgb(247,251,255)',
  'rgb(222,235,247)',
  'rgb(198,219,239)',
  'rgb(158,202,225)',
  'rgb(107,174,214)',
  'rgb(66,146,198)',
  'rgb(33,113,181)',
  'rgb(8,81,156)',
  'rgb(8,48,107)'
]


var ColorsLegend = React.createClass({

  getInitialProps: function() {
      return {
        padding: 10,
        shapeHeight: 30,
        count: 9
      }
  },

  componentDidUpdate: function() {
    this.update();
  },

  componentDidMount: function() {
    this.update();
  },


  update: function() {
    if (!this.props.countData) {
      return;
    }

    var format = function(value) {
        return Math.round(value);
        //console.log(value + " " + approx(value));
        //return approx(Math.round(value));
    }

    var colorLegend = legend.color()
        .labelFormat(format)
        //.orient('horizontal')
        .useClass(false)
        //.shapeWidth(100)
        .shapeHeight(30)
        .shapePadding(0)
        .scale(this.props.countData.destinationScale);

    d3.select(React.findDOMNode(this.refs.legend))
      .call(colorLegend);
  },


  render: function() {

    return (
      <div className="colors-legend">
          <div className="colors-legend__inner">
            <div className="colors-legend__title">
              Hakijoita / 100 000 asukasta
            </div>
            <div className="colors-legend-boxes">
              <svg style={{width: 110, height: 270}}>
                <g ref="legend" />
              </svg>
            </div>
          </div>
      </div>
    );

  }


});



var RefugeeMapBorder = React.createClass({


  componentDidMount: function() {
    this.sel = d3.select(React.findDOMNode(this.refs.subunit));
    this.overlaySel = d3.select(React.findDOMNode(this.refs.overlay));

    this.updateStyles(this.props);
  },


  updateStyles: function(nextProps) {

    if (this.overlaySel != null) {
      this.overlaySel
        .classed('subunit--hovered', nextProps.hovered && this.props.subunitClass == 'subunit-invisible')
        .classed('subunit--clicked', nextProps.clicked && this.props.subunitClass == 'subunit-invisible')
        .classed('subunit--missing-data', nextProps.missingData);
    }

    if (this.sel != null) {
        this.sel
          .classed('subunit--destination', nextProps.destination)
          .classed('subunit--origin', nextProps.origin);
    }

    this.updateWithCountDetails(nextProps.countDetails, nextProps.feature);
  },


  componentWillReceiveProps: function(nextProps, nextState) {
    this.updateStyles(nextProps);
  },


  updateWithCountDetails: function(details, countryFeatures) {
    if (this.props.subunitClass == 'subunit-invisible') {
      return;
    }

    var fill = 'rgba(255,255,255,1)';

    if (details != null && this.props.origin && getFullCount(details.originCounts) > 0) {

    } else if (details != null && this.props.destination && details.destinationCounts && details.destinationCounts > 0) {
       var v = details.destinationCounts
       fill = v > 0 ? details.destinationScale(v) : zeroColor;
    }
    this.sel.style('fill', fill);
  },


  shouldComponentUpdate: function(nextProps, nextState) {
    // it is important to prevent an expensive diff of the svg path
    // a react render will only be needed if we need to resize
    return this.props.projection !== nextProps.projection;
  },


  onMouseOver: function(){
    this.props.onMouseOver(this.props.country);
  },


  onMouseLeave: function(){
    this.props.onMouseLeave(this.props.country);
  },


  render: function() {

    // round pixels using a custom rendering context
    var d = "";
    var context = {
      beginPath: function() {
        d += "";
      },
      moveTo: function(x, y) {
        d += "M" + Math.round(x) + "," + Math.round(y);
      },
      lineTo: function(x, y) {
        d += "L" + Math.round(x) + "," + Math.round(y);
      },
      closePath: function() {
        d += "Z";
      },
      arc: function() {
        d += "";
      }
    };

    var path = this.props.path;
    path.context(context);
    path(this.props.feature);

    var country = this.props.country;
    var overlay = this.props.enableOverlay ? (
        <path key="p2" ref="overlay"
              className="subunit--overlay"
              onMouseOver={this.onMouseOver}
              onMouseLeave={this.onMouseLeave}
              d={d} />
      ) : null;

    return (
      <g>
        <path key="p1"
           ref="subunit"
           className={this.props.subunitClass}
           d={d}
           onMouseOver={this.onMouseOver}
           onMouseLeave={this.onMouseLeave} />
        {overlay}
      </g>
    );

  }

});



var RefugeeMapBordersLayer = React.createClass({


  getDefaultProps: function() {
    return {
      subunitClass: 'subunit',
      updatesEnabled: true
    };
  },

  onMouseOver: function(country) {
    if (this.props.onMouseOver) {
       this.props.onMouseOver(country);
    }
  },

  onMouseLeave: function(country) {
    if (this.props.onMouseLeave) {
       this.props.onMouseLeave(country);
    }
  },


  onClick: function() {
    if (this.props.onClick) {
       this.props.onClick();
    }
  },


  getHighlightParams: function(country) {
    if (!this.props.country) {
        return {
          destination: true,
          origin: false
        }
    };

    return {
       hovered: this.props.country == country,
       destination: this.props.destinationCountries.indexOf(country) != -1,
       origin: this.props.originCountries.indexOf(country) != -1
    };
  },



   /*
    * Get count data for current
    * this.props.country within this.props.timeRange
    *
    * Count data is an object containing:
    *   originCounts        -- array of counts of by originCountry
    *   destinationCounts   -- array of counts of by destinationCountry
    */
  getCountrySpecificCountData: function() {

    var timeRange = this.props.timeRange;

    var getMaxCount = function(counts) {
       return _.values(counts).reduce(function(prev, item) {
          return Math.max(prev, item.asylumApplications);
       },0);
    };

    var countData = null;
    var exponent = 0.5;

    if (this.props.country != null) {
      var originCounts = this.props.refugeeCountsModel
          .getDestinationCountsByOriginCountries(this.props.country, timeRange);
      var maxOriginCount = getMaxCount(originCounts);

      var destinationCounts = this.props.refugeeCountsModel
        .getOriginCountsByDestinationCountries(this.props.country, timeRange);
      var maxDestinationCount = getMaxCount(destinationCounts);

      var originScale = d3.scale.pow()
        .exponent(exponent).domain([0, maxOriginCount]).range([0.075, 0.80]);
      var destinationScale = d3.scale.pow()
        .exponent(exponent).domain([1, maxDestinationCount]).range([0.075, 0.80]);

      countData = {
        originCounts: originCounts,
        destinationCounts: destinationCounts,
        originScale: originScale,
        destinationScale: destinationScale
      };
    } else {

    }
    return countData;
  },


  getGlobalCountData: function() {
      var perHowMany = 100000
      var max = 0
      var destinationCounts = this.props.refugeeCountsModel
        .computePerCountry(this.props.timeRange, (country, total) => {
          var features = _.find(this.props.mapModel.featureData.features, f => f.properties.ADM0_A3 === country)
          var p = features ? this.getPerCapitaCount(total.asylumApplications, features, perHowMany) : 0
          max = p > max ? p : max
          return p
        });
      var destinationScale = d3.scale.quantize()
        .domain([0, max])
        .range(choroplethColors);

      var countData = {
        max: max,
        originCounts: {},
        destinationCounts: destinationCounts,
        originScale: null,
        destinationScale: destinationScale
      };
      return countData;
  },

  getPerCapitaCount: (applications, features, perHowMany) => {
    return applications / (features.properties.POP_EST / perHowMany)
  },

  getMaxCount: function(counts) {
    return _.values(counts).reduce(function(prev, item) {
        return Math.max(prev, item.asylumApplications);
    }, 0);
  },


  getCountData: function() {
      if (!this.props.refugeeCountsModel) {
        return null;
      }

      // if (this.props.country != null) {
      //     return this.getCountrySpecificCountData();
      // }
      return this.getGlobalCountData();
  },


   /*
    * Get paths representing map borders
    */
  getPaths: function(countData) {

    var countries = {};

    var missingDataCountries = [];
    if (this.props.refugeeCountsModel != null) {
      missingDataCountries = this.props.refugeeCountsModel
        .getDestinationCountriesWithMissingDataForTimeRange(this.props.timeRange);
    }

    // while we use React to manage the DOM,
    // we still use D3 to calculate the path
    var path = d3.geo.path().projection(this.props.projection);

    return this.props.mapModel.featureData.features.map(feature => {
      var country = feature.properties.ADM0_A3;
      var hparams = this.getHighlightParams(country);

      if (countries[country]) {
        console.log("duplicate for " + country);
      }
      countries[country] = true;

      var countDetails = null;
      if (countData != null) {
        countDetails = {
          originScale: countData.originScale,
          destinationScale: countData.destinationScale,
          destinationCounts: countData.destinationCounts[country],
          originCounts: countData.originCounts[country]
        };
      }

      return (
        <RefugeeMapBorder
          ref={country}
          enableOverlay={this.props.enableOverlay}
          subunitClass={this.props.subunitClass}
          key={country}
          onMouseLeave={this.onMouseLeave}
          onMouseOver={this.onMouseOver}
          path={path}
          feature={feature}
          country={country}
          width={this.props.width}
          projection={this.props.projection}
          countDetails={countDetails}
          missingData={missingDataCountries.indexOf(country) != -1}
          clicked={this.props.clickedCountry == country}
          hovered={this.props.country == country}
          destination={countData != null && countDetails.destinationCounts != null && countDetails.asylumApplications != 0}
          origin={countData != null && countDetails.originCounts != null && countDetails.asylumApplications != 0} />
      );
    });
  },


  shouldComponentUpdate: function(nextProps, nextState) {
    if (this.props.width !== nextProps.width
      || this.props.projection !== nextProps.projection) {
      return true;
    }

    if (!this.props.updatesEnabled) {
      return false;
    }

    if (nextProps.country !== this.props.country
      || nextProps.clickedCountry !== this.props.clickedCountry) {
      return true;
    }

    if (nextProps.timeRange !== this.props.timeRange) {
      return true;
    }

    return false;
  },


  getDefs: function() {
      return '<pattern id="diagonal-stripe-4" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzInLz4KPC9zdmc+" x="0" y="0" width="10" height="10"> </image> </pattern>';
      //return '<pattern id="diagonal-stripe-4" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzEnLz4KPC9zdmc+Cg==" x="0" y="0" width="10" height="10"> </image> </pattern>';
      //return '<pattern id="diagonal-stripe-4" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSdibGFjaycvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J3doaXRlJyBzdHJva2Utd2lkdGg9JzMnLz4KPC9zdmc+" x="0" y="0" width="10" height="10"> </image> </pattern>';
  },


  render: function() {

    var countData = this.getCountData();

    return (
      <div style={{width: this.props.width, height: this.props.height}}>
        <svg className="refugee-map-borders-layer"
            style={{width: this.props.width, height: this.props.height}}
            onClick={this.onClick}>
            <defs dangerouslySetInnerHTML={{__html: this.getDefs()}} />
            {this.getPaths(countData)}
        </svg>
        <ColorsLegend countData={countData} width={this.props.width} height={this.props.height} />
      </div>
    );
  },



});


module.exports = RefugeeMapBordersLayer;
