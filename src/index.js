import React, { Component } from "react";
import { render } from "react-dom";
import * as d3 from "d3";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
    };
  }

  componentDidMount() {
    const dataPath = "./data/dendorogram_hosei_kaihatu.json";
    window
      .fetch(dataPath)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ data });
      });
    //drawCluster();
  }

  render() {
    const { data } = this.state;
    if (data == null) {
      return <div>loading</div>;
    }
    return (
      <div className="App">
        <DrawDendrogram data={data} />
      </div>
    );
  }
}

const DrawDendrogram = ({ data }) => {
  console.log(data);
  const contentWidth = 1000;
  const contentHeight = 800;
  const margin = {
    left: 80,
    right: 20,
    top: 20,
    bottom: 80,
  };
  const width = contentWidth + margin.left + margin.right;
  const height = contentHeight + margin.top + margin.bottom;
  const data_j = data;

  const xScale = d3
    .scaleLinear()
    .domain([
      d3.max(data_j, (item) => item.height),
      d3.min(data_j, (item) => item.height),
    ])
    .range([0, contentWidth - 200]);

  const stratify = d3
    .stratify()
    .id((d) => d.name)
    .parentId((d) => d.parent);
  const data_stratify = stratify(data_j);
  const root = d3.hierarchy(data_stratify);
  console.log(root);

  const cluster = d3.cluster().size([contentHeight, contentWidth - 200]);
  cluster(root);
  console.log(root);
  console.log(root.descendants());

  const testData = root.descendants();
  return (
    <svg viewBox={`0 0 ${width} ${height}`}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {testData.slice(1).map((item) => {
          return (
            <path
              className="link"
              d={`M${xScale(item.data.data.height)},${item.x}
                      L${xScale(item.parent.data.data.height)},${item.x}
                      L${xScale(item.parent.data.data.height)},${
                item.parent.x
              }`}
            />
          );
        })}
        {testData.map((item, i) => {
          return (
            <g
              key={i}
              transform={`translate(${xScale(item.data.data.height)},${
                item.x
              })`}
            >
              <circle r="1" fill="#555"></circle>
              <text
                dy="5"
                x={item.children ? -10 : 5}
                y="-4"
                font-size="30%"
                textAnchor={item.children ? "end" : "start"}
              >
                {item.children ? null : item.data.data["事業名"]}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
render(<App />, document.querySelector("#content"));
