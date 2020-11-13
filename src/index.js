import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import * as d3 from "d3";
import "bulma/css/bulma.css";

const App = () => {
  const [data, setData] = useState([]);
  const dataPath = "./data/plot_test_data_25.json";

  useEffect(() => {
    window
      .fetch(dataPath)
      .then((response) => response.json())
      .then((data) => {
        d3.forceSimulation(data)
          .force(
            "collide",
            d3
              .forceCollide()
              .radius(function (d) {
                return Math.pow(d.count, 0.7) + 8;
              })

              .strength(0.01)
              .iterations(30)
          )
          .force("charge", d3.forceManyBody().strength(1))
          .force("center", d3.forceCenter())
          .on("end", () => {
            setData(data);
          });
      });
  }, []);

  if (data.length === 0) {
    return <div>loading</div>;
  } else {
    return (
      <div>
        <div className="hero is-info is-bold">
          <div className="hero-body">
            <div className="container">
              <h1 className="title">行政事業可視化</h1>
              <h2 className="subtitle">情報科学研究 国家財政チーム</h2>
            </div>
          </div>
        </div>

        <div className="App">
          <WordPlot data={data} />
        </div>

        <footer className="footer">
          <div className="content has-text-centered">
            <p>&copy; 2020 上野瑞貴 野村理沙</p>
          </div>
        </footer>
      </div>
    );
  }
};

//////////////////////////
const WordPlot = ({ data }) => {
  const [word, setWord] = useState("");
  const [selectedWord, setSelectedWord] = useState("");
  const contentWidth = 460;
  const contentHeight = 460;

  const margin = {
    left: 150,
    right: 150,
    top: 30,
    bottom: 50,
  };

  const width = contentWidth + margin.left + margin.right;
  const height = contentHeight + margin.top + margin.bottom;

  const color = d3.scaleOrdinal(d3.schemeAccent);
  const cicleSize = (d) => Math.pow(d.count, 0.7);

  const xScale = d3
    .scaleLinear()
    .domain([d3.min(data, (item) => item.x), d3.max(data, (item) => item.x)])
    .range([0, contentWidth])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([d3.max(data, (item) => item.y), d3.min(data, (item) => item.y)])
    .range([0, contentHeight])
    .nice();

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">キーワードバブルチャート</h1>
        <p>
          2019年度公開の約5000の行政事業の事業概要からそれぞれキーワードを抽出し、キーワード毎に事業概要にキーワードが含まれている事業の執行額を担当府省庁別で集計をしてデータ作成を行いました。その結果を次元削減し、事業からキーワードを抽出した際に出現頻度の高かった117個のキーワードを二次元空間に表示しています。円の大きさはキーワードの出現頻度で決め、位置の近さで色付けしています。
        </p>
        <p
          className="has-text-weight-bold"
          style={{
            fontSize: "large",
            marginTop: "0.7rem",
            marginBottom: "1.0rem",
          }}
        >
          キーワードをクリックするとクリックしたキーワードが事業概要に含まれる事業がページ下部に表示されます。
        </p>

        <svg viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {data.map((item, i) => {
              return (
                <g
                  key={i}
                  onClick={() => {
                    setWord(item.word);
                  }}
                  onMouseEnter={() => {
                    setSelectedWord(item.word);
                  }}
                  onMouseLeave={() => {
                    setSelectedWord("");
                  }}
                  transform={`translate(${xScale(item.x)}, ${yScale(item.y)})`}
                  style={{ cursor: "pointer" }}
                >
                  <title>{`word:${item.word}`}</title>
                  <circle r={cicleSize(item)} fill={color(item.color)} />
                  <text
                    fontSize={`${cicleSize(item) * 0.8}px`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={item.word === selectedWord ? "blue" : "black"}
                  >
                    {item.word}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div>
        {word === "" ? (
          <div>
            キーワードをクリックするとここにデンドログラムが表示されます
          </div>
        ) : (
          <DrawDendrogram word={word} />
        )}
      </div>
    </section>
  );
};

////////////////////////////
const DrawDendrogram = ({ word }) => {
  const [data, setData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [ministries, setMinistries] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [selectedNodeName, setSelectedNodeName] = useState("");
  const [displayedNodeName, setDisplayedNodeName] = useState("");
  const [selectedNodeLeaves, setSelectedNodeLeaves] = useState([]);
  const [nodeLeavesData, setNodeLeavesData] = useState([]);
  const dataPath = `./data/dendrogramData2/${word}.json`;

  useEffect(() => {
    window
      .fetch(dataPath)
      .then((response) => response.json())
      .then((data) => {
        setData(data);
      });
  }, [dataPath]);

  useEffect(() => {
    window
      .fetch("./data/tsne_+_clusters_list.json")
      .then((response) => response.json())
      .then((data) => {
        const ministriesSet = new Set();
        data.map((item) => {
          return ministriesSet.add(item["府省庁"]);
        });
        setMinistries(Array.from(ministriesSet));

        const newData = data.filter((item) => {
          return item["公開年度"] === "2019" && item["事業名"] === projectName;
        });
        setProjectData(newData);
      });
  }, [projectName]);

  useEffect(() => {
    window
      .fetch("./data/tsne_+_clusters_list.json")
      .then((response) => response.json())
      .then((data) => {
        const newNodeLeavesData = [];
        for (const node of selectedNodeLeaves) {
          for (const project of data) {
            if (
              project["事業名"] === node.data.data["事業名"] &&
              project["公開年度"] === "2019" &&
              project["府省庁"] === node.data.data["府省庁"]
            ) {
              newNodeLeavesData.push({
                事業名: project["事業名"],
                執行額: +project["執行額"],
                補正予算: project["補正予算"],
                府省庁: project["府省庁"],
              });
            }
          }
        }
        setNodeLeavesData(newNodeLeavesData);
      });
  }, [selectedNodeLeaves]);

  if (data.length === 0) {
    return <div></div>;
  }

  const fontSize = 10;
  const separation = 5;
  const contentWidth = (fontSize + separation) * (data.length / 2);
  const contentHeight = 400;
  const ministriesCol = d3.scaleOrdinal(d3.schemeCategory10);
  //const ministriesCol = d3
  //.scaleLinear()
  //.domain([0, 4, 8, 12, 16, 20])
  //.range(["red", "orange", "yellow", "green", "blue", "purple"]);

  const margin = {
    left: 160,
    right: 200,
    top: 75,
    bottom: 150,
  };

  const ministriesList = [];
  ministries.map((item, i) => {
    return ministriesList.push({ 府省庁: item, color: ministriesCol(i) });
  });

  const fillColor = (ministryName) => {
    let color = "";
    ministriesList.forEach((ministry) => {
      if (ministry["府省庁"] === ministryName) {
        color = ministry.color;
      }
    });
    return color;
  };

  //const width = contentWidth + margin.left + margin.right;
  const height = contentHeight + margin.top + margin.bottom;

  const yScale = d3
    .scaleLinear()
    .domain([
      d3.max(data, (item) => item.height),
      d3.min(data, (item) => item.height),
    ])
    .range([0, contentHeight - 200]);

  const stratify = d3
    .stratify()
    .id((d) => d.name)
    .parentId((d) => d.parent);

  const data_stratify = stratify(data);
  const root = d3.hierarchy(data_stratify);
  const cluster = d3
    .cluster()
    .size([contentWidth, contentHeight - 200])
    .separation(() => separation);
  cluster(root);

  const testData = root.descendants();

  const shape = d3.scaleOrdinal(
    ministriesList.map((d) => d["府省庁"]),
    d3.symbols.map((s) => d3.symbol().type(s).size(90)())
  );

  return (
    <div>
      <h1 className="title">事業概要に"{word}"を含む事業のデンドログラム</h1>
      <p>
        ここでは上の図でクリックされたキーワードを事業概要に含む事業の事業概要をベクトル表現したデータを用いて階層クラスター分析を行い、その結果をデンドログラムで表示しており、図の下の方で結合している事業は近い関係にあるといえます。
      </p>
      <p
        className="has-text-weight-bold"
        style={{
          fontSize: "large",
          marginTop: "0.7rem",
          marginBottom: "2.0rem",
        }}
      >
        デンドログラムの事業名をクリックすると、事業の詳細がページ下部に表示されます。
      </p>
      <div style={{ overflowX: "auto" }}>
        <svg width="1195" height={margin.top}>
          {ministriesList.map((item, i) => {
            return (
              <g
                transform={`translate(${
                  i < 7
                    ? 50 + 160 * i
                    : i < 14
                    ? 50 + 160 * (i - 7)
                    : 50 + 160 * (i - 14)
                }, ${i < 7 ? 17 : i < 14 ? 34 : 51})`}
              >
                <path d={shape(item["府省庁"])} fill={item.color} />
                {/*<circle r="6" fill={item.color} />*/}
                <text x="7" y="5">
                  {item["府省庁"]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ overflowX: "scroll" }}>
        <svg width={contentWidth + margin.right} height={height}>
          <g transform={`translate(0,0)`}>
            {testData.slice(1).map((item) => {
              return (
                <path
                  className="link"
                  d={`M${item.x},${yScale(item.data.data.height)}
                        L${item.x},${yScale(item.parent.data.data.height)}
                        L${item.parent.x},${yScale(
                    item.parent.data.data.height
                  )}`}
                />
              );
            })}

            {testData.map((item, i) => {
              return (
                <g
                  key={i}
                  transform={`translate(${item.x},${yScale(
                    item.data.data.height
                  )})`}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setProjectName(item.data.data["事業名"]);
                    if (item.children !== undefined) {
                      //setSelectedNode(item);
                      setSelectedNodeLeaves(item.leaves());
                      //console.log(selectedNode);
                      //console.log(selectedNodeLeaves);
                      setDisplayedNodeName(item.data.data.name);
                    }
                  }}
                  onMouseEnter={() => {
                    if (item.children !== undefined) {
                      setSelectedNodeName(item.data.data.name);
                      //console.log(selectedNodeName);
                    }
                    setSelectedName(item.data.data["事業名"]);
                  }}
                  onMouseLeave={() => {
                    if (item.children !== undefined) {
                      setSelectedNodeName("");
                      //console.log(selectedNodeName);
                    }
                    setSelectedName("");
                  }}
                >
                  {item.children ? (
                    <circle
                    r={item.children ? "3" : "6"}
                    fill={selectedNodeName === item.data.data.name 
                      ? "blue" 
                      : displayedNodeName === item.data.data.name ? "brown" : "black"}
                  ></circle>
                  ) : (
                    <path
                      d={shape(item.data.data["府省庁"])}
                      fill={fillColor(item.data.data["府省庁"])}
                    />
                  )}
                  {/*<circle
                    r={item.children ? "2" : "6"}
                    fill={fillColor(item.data.data["府省庁"])}
                  ></circle>*/}
                  <text
                    transform="translate(-3,10) rotate(45)"
                    y={item.children ? -10 : 2}
                    x="0"
                    fontSize={`${fontSize}px`}
                    textAnchor={item.children ? "end" : "start"}
                    fill={
                      item.data.data["事業名"] === selectedName
                        ? "blue"
                        : item.data.data["事業名"] === projectName ? "brown" : "black"
                      
                    }
                  
                  >
                    {item.children ? null : item.data.data["事業名"]}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="columns">
        <div className="column is-6">
          {nodeLeavesData.length === 0 ? (
            <div>ノードをクリックすると下</div>
          ) : (
            
            <DrawHistogram nodeLeavesData={nodeLeavesData} />
            
          )}
        </div>
        <div className="column is-4">
          {projectData.length === 0 ? (
            <div>事業名をクリックするとここに事業の詳細が表示されます</div>
          ) : (
            <ProjectTable projectData={projectData} />
          )}
        </div>
      </div>
    </div>
  );
};

/////////////////////////////
const ProjectTable = ({ projectData }) => {
  return (
    <div className="container">
      <h1 className="title">{projectData["0"]["事業名"]}</h1>
      <h2 className="has-text-weight-bold">府省庁</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "1.0rem" }}>
        {projectData["0"]["府省庁"]}
      </p>
      <h2 className="has-text-weight-bold">当初予算(百万円)</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "1.0rem" }}>
        {projectData["0"]["当初予算"]}
      </p>
      <h2 className="has-text-weight-bold">補正予算(百万円)</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "1.0rem" }}>
        {projectData["0"]["補正予算"]}
      </p>
      <h2 className="has-text-weight-bold">執行額(百万円)</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "1.0rem" }}>
        {projectData["0"]["執行額"]}
      </p>
      <h2 className="has-text-weight-bold">事業の目的</h2>
      <p style={{ marginLeft: "0.75rem", marginbottom: "0.8rem" }}>
        {projectData["0"]["事業の目的"]}
      </p>
      <h2 className="has-text-weight-bold">事業概要</h2>
      <p
        style={{
          marginLeft: "0.75rem",
          marginbottom: "0.8rem",
        }}
      >
        {projectData["0"]["事業概要"]}
      </p>
    </div>
  );
};

//////////////////////
const DrawHistogram = ({ nodeLeavesData }) => {
  const contentWidth = 300;
  const contentHeight = 100;

  const margin = {
    left: 30,
    right: 50,
    top: 20,
    bottom: 50,
  };

  const width = contentWidth + margin.left + margin.right;
  const height = contentHeight + margin.top + margin.bottom;

  const projectsMoney = [];
  for (const node of nodeLeavesData) {
    projectsMoney.push(node["執行額"]);
  }

  const binCol = "blue";

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(projectsMoney)])
    .range([0, contentWidth])
    .nice();

  const histogramData = d3
    .histogram()
    .domain(xScale.domain())
    .thresholds(xScale.ticks(15))(projectsMoney);

  const yScale = d3
    .scaleLinear()
    .domain([d3.max(histogramData, (item) => item.length), 0])
    .range([0, contentHeight])
    .nice();

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {xScale.ticks().map((x) => {
            return (
              <g transform={`translate(${xScale(x)},0)`}>
                <line
                  x1="0"
                  y1={contentHeight}
                  x2="0"
                  y2={contentHeight + 2}
                  stroke="black"
                />
                <text y={contentHeight + 8} textAnchor="middle" font-size="5">
                  {x}
                </text>
              </g>
            );
          })}
          {yScale.ticks().map((y) => {
            return (
              <g transform={`translate(0,${yScale(y)})`}>
                {Number.isInteger(y) ? (
                  <line x1="-2" y1="0" x2="0" y2="0" stroke="black" />
                ) : null}
                <line
                  x1="0"
                  y1="0"
                  x2={contentWidth}
                  y2="0"
                  stroke="gainsboro"
                />
                <text x="-7" y="1" textAnchor="middle" fontSize="5">
                  {Number.isInteger(y) ? y : null}
                </text>
              </g>
            );
          })}
          {histogramData.map((bin, i) => {
            return (
              <g
                key={i}
                transform={`translate(${xScale(bin.x0)}, ${yScale(
                  bin.length
                )})`}
              >
                <rect
                  x="0"
                  width={
                    xScale(histogramData[0].x1) -
                    xScale(histogramData[0].x0) -
                    1
                  }
                  height={contentHeight - yScale(bin.length)}
                  fill={binCol}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
render(<App />, document.querySelector("#content"));
