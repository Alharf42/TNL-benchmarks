var root = document.getElementById("content");
var op;

var SizeTable ={
    view: function(vnode){
        let op = vnode.attrs.op;
        let allSData = vnode.attrs.allSData;
        let host_allocator_perOp=vnode.attrs.host_allocator_perOp;
        let allBDataPk = vnode.attrs.allBDataPk;
        
        return [
        m("table",[
            m("tr", [
                m("th","Precision"),
                host_allocator_perOp[op] ? m("th","Host allocator"):null,
                m("th","Size"),
                m("th","Performer"),
                m("th","Time"),
                m("th","stddev"),
                m("th","stddev/time"),
                m("th","Loops"),
                m("th","Bandwidth"),
                m("th","Speedup")
            ]),
            //create tr for every record in allSData per op
            allSData.filter(record=>allBDataPk[record.fields.benchmark].operation==op).map(record=>{
                let allBDataId = record.fields.benchmark;
                let benchmark = allBDataPk[allBDataId];
                return m("tr",[
                    m("td",benchmark.precision),
                    //will create td for host_allocator only if its not null
                    host_allocator_perOp[op] ? m("td",record.fields.host_allocator):null,
                    m("td",record.fields.size),
                    m("td",benchmark.performer),
                    m("td",{class: "un-bold"},benchmark.time),
                    m("td",{class: "un-bold"},benchmark.stddev),
                    m("td",{class: "un-bold"},benchmark.stddev_time),
                    m("td",{class: "un-bold"},benchmark.loops),
                    m("td",{class: "un-bold"},benchmark.bandwidth),
                    benchmark.speedup?m("td",{class: "un-bold"},benchmark.speedup):m("td",{class: "un-bold"},"NaN"),

                ]);
            })

        ])]
    
    }
};

var ColumnTable ={
    view: function(vnode){
        let allCData = vnode.attrs.allCData;
        let allBDataPk = vnode.attrs.allBDataPk;
        return [
        m("table",[
            m("tr",[
                m("th","Precision"),
                m("th","Rows"),
                m("th","Columns"),
                m("th","Performer"),
                m("th","Time"),
                m("th","stddev"),
                m("th","stddev/time"),
                m("th","Loops"),
                m("th","Bandwidth"),
                m("th","Speedup")
            ]),
            allCData.map(record=>{
                let allBDataId= record.fields.benchmark;
                let benchmark=allBDataPk[allBDataId];
                return m("tr",[
                    m("td",benchmark.precision),
                    m("td",record.fields.rows),
                    m("td",record.fields.columns),
                    m("td",benchmark.performer),
                    m("td",{class: "un-bold"},benchmark.time),
                    m("td",{class: "un-bold"},benchmark.stddev),
                    m("td",{class: "un-bold"},benchmark.stddev_time),
                    m("td",{class: "un-bold"},benchmark.loops),
                    m("td",{class: "un-bold"},benchmark.bandwidth),
                    benchmark.speedup?m("td",{class: "un-bold"},benchmark.speedup):m("td",{class: "un-bold"},"NaN"),
                ])
            })
        ])]

    }
};
//graph for size tables made with plotly
const LineGraph ={
    oncreate: function(vnode){
        let allSData = vnode.attrs.allSData;
        let allBDataPk = vnode.attrs.allBDataPk;
        let host_allocator_perOp = vnode.attrs.host_allocator_perOp;
        //current operation
        let op = vnode.attrs.op;
        //matrix in each row host allocator, size, performer and bandwidth
        let tableData =[];
        let host_allocator=[];
        let performers=[];
        //need bandwidth for each specific performer and host allocator
        //stddev/time for counting the error
        //assign data from allSData filtered by current op to each previously defined variable
        allSData.filter(record=>allBDataPk[record.fields.benchmark].operation==op).map(record=>{
            host_allocator_perOp[op] ? host_allocator.push(record.fields.host_allocator) : null;
            //FK of the benchmark table in the record from allSData
            let allBDataId = record.fields.benchmark;
            //benchmark record from allBData  per its FK in allSData
            let benchmark = allBDataPk[allBDataId];
            performers.push(benchmark.performer);
            tableData.push([record.fields.host_allocator,record.fields.size,benchmark.performer,benchmark.bandwidth, benchmark.stddev_time]);
        })
        //set of each trace
        let data=[];
        var trace = [];
        //data for x axis;size
        var x=[];
        //data for y axis;bandwidth
        var y =[];
        //iterate unique sets; filter matrix with all the whole sets by current values in unique sets;generate traces;add them to data
        let performerUnique = [...new Set(performers)];
        let host_allocatorUnique;
        host_allocator_perOp[op]? host_allocatorUnique = [...new Set(host_allocator)]:null;
        host_allocator_perOp[op]
        ? host_allocatorUnique.map(h=>{
            performerUnique.map(p=>{
                x=tableData.filter(record=> record[0]==h && record[2]==p).map(record=>record[1]);
                y=tableData.filter(record=> record[0]==h && record[2]==p).map(record=>record[3]);
                stddev_time=tableData.filter(record=> record[0]==h && record[2]==p).map(record=>record[4]);
                trace =
                {
                    x: x,
                    y: y,
                    error_y: {
                        type: "data",
                        //y and stddev_time has the same length
                        array: y.map((value,index)=>value*stddev_time[index]),
                        visible: true
                    },
                    name: `${h},${p}`,
                    type: 'scatter'
                }
                data.push(trace);
            })
        })
          :  performerUnique.map(p=>{
                x=tableData.filter(record=>record[2]==p).map(record=>record[1]);
                y=tableData.filter(record=>record[2]==p).map(record=>record[3]);
                stddev_time=tableData.filter(record=>record[2]==p).map(record=>record[4]);
                trace =
                {
                    x: x,
                    y: y,
                    error_y: {
                        type: "data",
                        array: y.map((value,index)=>value*stddev_time[index]),
                        visible: true
                    },
                    name: `${p}`,
                    type: 'scatter'
                }
                data.push(trace);
            });

          var layout = {
            xaxis: {
              title: 'size',
              showgrid: false,
              //color of the plot's border
              linecolor: "black",
              linewidth: 1.2,
              //creates the border on both sides
              mirror: true,
              rangemode: "nonnegative",
              ticklen: 15,
              //dtick: 1,

              
            },
            yaxis: {
              title: 'bandwidth[GiB/s]',
              showgrid: false,
              linecolor: "black",
              linewidth: 1.2,
              mirror: true,
              rangemode: "nonnegative",
              ticklen: 15,
              //dtick: 25,
            },
            autosize: false,     
            paper_bgcolor: 'rgba(255,255,255,0.6)',
            plot_bgcolor: 'rgba(255,255,255,0.6)',
            legend: {
                bgcolor: 'rgba(255,255,255,0.6',
            }
          };

        Plotly.newPlot(vnode.dom,data,layout);

    },
    view: function(){
        return m("div");
    }
}
//heatmap in plotly made for data in column tables
const ColumnGraph = {
    oncreate: function(vnode){
        
        let allCData = vnode.attrs.allCData;
        let allBDataPk = vnode.attrs.allBDataPk;
        //set of performers
        //unique performers->get from filtering z_performer->new Set
        var performerUnique=[];
        //iterate allCData get performers, create matrix with z and performer
        //z is a 2D array for plotly heatmap
        //its value is bandwidth corresponding with its column and row, thus being in the proper array index
        //as in columns and rows unique sets
        var z_performer=[];
        allCData.map(record=>{
            var allBDataId=record.fields.benchmark;
            var benchmark=allBDataPk[allBDataId];
            z_performer.push([record.fields.columns,record.fields.rows,benchmark.bandwidth,benchmark.performer],);
        })
        performerUnique=[...new Set(z_performer.map(record=>record[3]))];
        //iterate unique performers create z, data, plots per unique performer
        performerUnique.map(p=>{
            ///create z as a 2D array
            //get unique columns and rows
            const columns = [...new Set(z_performer.filter(record=>record[3]==p).map(item => item[0]))].sort((a, b) => a - b);
            const rows = [...new Set(z_performer.filter(record=>record[3]==p).map(item => item[1]))].sort((a, b) => a - b);
            // Initialize a 2D array with null-not zeros-to not show 0 when there is no data in allCData
            const zValues = rows.map(row => columns.map(() => null));
            // Populate the 2D array
            z_performer.filter(record=>record[3]==p).forEach(([col, row, value]) => {
                const colIndex = columns.indexOf(col);
                const rowIndex = rows.indexOf(row);
                if (colIndex !== -1 && rowIndex !== -1) {
                    zValues[rowIndex][colIndex] = value;
                }
            });       
            //create custom x, y values converted to string
            //and set ticktext
            //tickvals are set to set from 0 to 21-index numbers of rows and columns sets
            //those being the index numbers of zValues
            y=rows.map(row=>row.toString()).reverse();
            x=columns.map(col=>col.toString());
            var data = 
            [{
              z: zValues,
              colorscale: "Viridis",
              type: 'heatmap',
              colorbar: {
                    title: 'bandwidth(GiB/s)',
                }
            }];
            var layout = 
            {
                title: `${p}`,
                xaxis: {
                  title: 'columns',
                  showgrid: false,
                  //lines around graph
                  linecolor: "black",
                  linewidth: 1.2,
                  mirror: true,
                  //ruler
                  ticklen: 5,
                  //which values should be shown
                  //for which ticks in the plot
                  tickvals: [...Array(columns.length).keys()],
                  //should be shown which string
                  ticktext: x,
                  tickangle: 55,
                  tick0: 10,
                  //range between ticks
                  dtick: 1,
                },
                yaxis: {
                  title: 'rows',
                  showgrid: false,
                  linecolor: "black",
                  linewidth: 1.2,
                  mirror: true,
                  ticklen: 5,
                  tickvals: [...Array(rows.length).keys()].reverse(),
                  ticktext: y,
                  autorange: "reversed",
                  tick0: 10,
                  dtick: 1,
                },
                autosize: false,
            width:550,
            height:450,
            paper_bgcolor: 'rgba(255,255,255,0.6)',
            plot_bgcolor: 'rgba(255,255,255,0.7)',
              };
            //so that the plotly graphs are not overwritten(only one graph would be shown); create div for each
            //plotly plots should inside of div
              var div = document.createElement('div',{class: 'columnPlot'});
              div.classList.add('columnPlot');  
              vnode.dom.appendChild(div);
          Plotly.newPlot(div, data,layout);
        })
        
        
          
    },
    view: function(){
        return m("div.columnPlotContainer");
    }
}

//create nav
var nav={
    view: function(){
        return[m("section",{id: "ToC"},[
           // m("h1","Table of Contents"),
           m("button",[m(m.route.Link,{href: "/home"},"Home")]),
           m("div.dropdown",[
            m("button.dropbtn","Table of Contents"),
            m("ol.dropdown-content",[     
                djangoData.operation_order.map(op=>
                    //there needs to be no white spaces int the link
                    m("li",[m(m.route.Link,{href: `/${op.replaceAll(" ","")}`},`${op}`)])
                ),
                m("li",[m(m.route.Link,{href: "/gemv"},"gemv")])
            ])
        ])
        ]),
    ]}
}
//create home route
var Home={
    view: function(){
        return[ m(nav)
        
    ]}
}
//iterate ops-create page components-route them
var TableSection;
var sectionContainer =[];
//function to create size "page" per op
function TableSection(op){
    return{
    view: function(){
        return [m(nav),
            m("section",[
                //create table and graph for every op
                m("div",[
                    m("h1",{id: op},op),
                    m("div.sizeDiv",[
                    m(SizeTable,{
                        op,
                        allSData: djangoData.allSData,
                        host_allocator_perOp: djangoData.host_allocator_perOp,
                        allBDataPk: djangoData.allBDataPk
                    }),
                    m(LineGraph,{
                        op,
                        allSData: djangoData.allSData,
                        host_allocator_perOp: djangoData.host_allocator_perOp,
                        allBDataPk: djangoData.allBDataPk
                    }),
                ])

        ]),
        ])
    ]
    }
}
}


var gemv={
    view: function(){
     return[
        m(nav),
        m("section",[  
         m("div",[
            m("h1",{id: "gemv"},"gemv"),
            m("div.columnDiv",[
                m(ColumnTable,{
                        allCData: djangoData.allCData,
                        allBDataPk: djangoData.allBDataPk
                    }),
                    m(ColumnGraph,{
                        allCData: djangoData.allCData,
                        allBDataPk: djangoData.allBDataPk
                    })
            ])
        ]),
    ]),
    ]}
}
//add size "pages" to sectionContainer
djangoData.operation_order.map(op=>
    sectionContainer[op]=TableSection(op)
)
sectionContainer["gemv"]=gemv;
//m.mount(root, TableSection);

// Create the route map
var routes = {
    "/": Home,
};

// add routes to routes per op
djangoData.operation_order.forEach(op => {
    routes[`/${op.replaceAll(" ","")}`] = TableSection(op);
});
routes["/gemv"]=gemv;
//console.log(routes);
//route
m.route(root, "/", routes);