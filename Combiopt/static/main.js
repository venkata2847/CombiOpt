async function postRun(problem, method, dataset) {
  const res = await fetch("/run", {
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({problem, method, dataset})
  });
  return res.json();
}

function showSummary(obj) {
  const el = document.getElementById("summary");
  el.innerHTML = `
    <p><strong>Problem:</strong> ${obj.problem}</p>
    <p><strong>Method:</strong> ${obj.method}</p>
    <p><strong>Dataset:</strong> ${obj.dataset}</p>
    <p><strong>Runtime (s):</strong> ${obj.runtime_sec}</p>
    <p><strong>Quality:</strong> ${obj.quality ?? "N/A"}</p>
    <p><strong>Solution:</strong> ${JSON.stringify(obj.solution)}</p>
  `;
}

// Charts
var runtimeChart = null;
var qualityChart = null;

function createOrUpdateCharts(data){
  const ctx = document.getElementById('runtimeChart').getContext('2d');
  const qctx = document.getElementById('qualityChart').getContext('2d');

  if(!runtimeChart){
    runtimeChart = new Chart(ctx, {type:'bar',data:{labels:[data.method],datasets:[{label:'Runtime',data:[data.runtime_sec]}]},options:{responsive:true}});
  }else{runtimeChart.data.datasets[0].data=[data.runtime_sec]; runtimeChart.update();}

  if(!qualityChart){
    qualityChart = new Chart(qctx,{type:'bar',data:{labels:[data.method],datasets:[{label:'Quality',data:[data.quality ?? 0]}]},options:{responsive:true}});
  }else{qualityChart.data.datasets[0].data=[data.quality ?? 0]; qualityChart.update();}
}

// TSP route lines
function drawTsp(coords, route){
  const viz=document.getElementById('viz'); viz.innerHTML="";
  const W=600,H=400,pad=20;
  const xs=coords.map(c=>c[0]),ys=coords.map(c=>c[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs);
  const minY=Math.min(...ys),maxY=Math.max(...ys);
  const sx=x=>pad+((x-minX)/(maxX-minX||1))*(W-pad*2);
  const sy=y=>pad+((y-minY)/(maxY-minY||1))*(H-pad*2);
  const svgNS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(svgNS,"svg");
  svg.setAttribute("width",W); svg.setAttribute("height",H); svg.style.border="1px solid #ddd";
  for(let i=0;i<route.length;i++){
    const a=coords[route[i]],b=coords[route[(i+1)%route.length]];
    const line=document.createElementNS(svgNS,"line");
    line.setAttribute("x1",sx(a[0])); line.setAttribute("y1",sy(a[1]));
    line.setAttribute("x2",sx(b[0])); line.setAttribute("y2",sy(b[1]));
    line.setAttribute("stroke","#2b8cbe"); line.setAttribute("stroke-width",2);
    svg.appendChild(line);
  }
  coords.forEach(p=>{
    const circle=document.createElementNS(svgNS,"circle");
    circle.setAttribute("cx",sx(p[0])); circle.setAttribute("cy",sy(p[1])); circle.setAttribute("r",4);
    circle.setAttribute("fill","#f03b20"); svg.appendChild(circle);
  });
  viz.appendChild(svg);
}

// TSP pie chart
function drawTspPie(coords, route){
  const viz=document.getElementById('extraOutputs'); viz.innerHTML="";
  const lengths=[]; for(let i=0;i<route.length;i++){const a=coords[route[i]],b=coords[route[(i+1)%route.length]]; lengths.push(Math.hypot(b[0]-a[0],b[1]-a[1]));}
  const canvas=document.createElement('canvas'); viz.appendChild(canvas);
  new Chart(canvas.getContext('2d'),{type:'pie',data:{labels:route.map((r,i)=>`Leg ${i+1}`),datasets:[{data:lengths,backgroundColor:route.map((_,i)=>`hsl(${i*360/route.length},70%,50%)`)}]},options:{plugins:{legend:{position:'bottom'},datalabels:{color:'#000',formatter:v=>v.toFixed(2)}}},plugins:[ChartDataLabels]});
}

// Knapsack pie chart
function drawKnapsackPie(items, selected){
  const viz=document.getElementById('viz'); viz.innerHTML="";
  const canvas=document.createElement('canvas'); viz.appendChild(canvas);
  const selectedValue=items.filter(i=>selected.includes(i.id)).reduce((s,i)=>s+i.value,0);
  const unselectedValue=items.filter(i=>!selected.includes(i.id)).reduce((s,i)=>s+i.value,0);
  new Chart(canvas.getContext('2d'),{type:'pie',data:{labels:['Selected','Unselected'],datasets:[{data:[selectedValue,unselectedValue],backgroundColor:['#2b8cbe','#ddd']}]},options:{plugins:{legend:{position:'bottom'},datalabels:{color:'#000',formatter:v=>v}}},plugins:[ChartDataLabels]});
}

// Run button
document.getElementById("runBtn").onclick=async()=>{
  const problem=document.getElementById("problem").value;
  const method=document.getElementById("method").value;
  const dataset=document.getElementById("dataset").value;
  const result=await postRun(problem,method,dataset);
  if(result.error){alert(result.error); return;}
  showSummary(result); createOrUpdateCharts(result);
  document.getElementById("downloadBtn").disabled=false;
  window.lastResultFile=result.result_file;

  if(problem==='tsp' && result.solution.route){
    const resp=await fetch(`/data/tsp/${dataset}.csv`);
    const txt=await resp.text();
    const coords=txt.trim().split("\n").map(l=>l.split(",").map(Number));
    drawTsp(coords,result.solution.route);
    drawTspPie(coords,result.solution.route);
  }else if(problem==='knapsack' && result.solution.selected){
    drawKnapsackPie(result.solution.items,result.solution.selected);
  }
};

// Download result
document.getElementById("downloadBtn").onclick=()=>{
  if(!window.lastResultFile) return;
  const a=document.createElement('a'); a.href=`/download/${window.lastResultFile}`;
  a.download=window.lastResultFile; document.body.appendChild(a); a.click(); a.remove();
};
async function postRun(problem, method, dataset) {
  const res = await fetch("/run", {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({problem, method, dataset})
  });
  return res.json();
}

function showSummary(obj) {
  const el = document.getElementById("summary");
  el.innerHTML = `
    <p><strong>Problem:</strong> ${obj.problem}</p>
    <p><strong>Method:</strong> ${obj.method}</p>
    <p><strong>Dataset:</strong> ${obj.dataset}</p>
    <p><strong>Runtime (s):</strong> ${obj.runtime_sec}</p>
    <p><strong>Quality:</strong> ${obj.quality ?? "N/A"}</p>
    <p><strong>Solution:</strong> ${JSON.stringify(obj.solution)}</p>
  `;
}
var runtimeChart = null;
var qualityChart = null;

function createOrUpdateCharts(data) {
  const ctx = document.getElementById('runtimeChart').getContext('2d');
  if(!runtimeChart){
    runtimeChart = new Chart(ctx, {type:'bar', data:{labels:[data.method], datasets:[{label:'Runtime', data:[data.runtime_sec]}]}, options:{responsive:true}});
  } else { runtimeChart.data.datasets[0].data=[data.runtime_sec]; runtimeChart.update(); }

  const qctx = document.getElementById('qualityChart').getContext('2d');
  if(!qualityChart){
    qualityChart = new Chart(qctx, {type:'bar', data:{labels:[data.method], datasets:[{label:'Quality', data:[data.quality ?? 0]}]}, options:{responsive:true}});
  } else { qualityChart.data.datasets[0].data=[data.quality ?? 0]; qualityChart.update(); }
}

// TSP Route visualization
function drawTsp(coords, route){
  const viz = document.getElementById('viz'); viz.innerHTML = "";
  const W=600,H=400,pad=20;
  const xs=coords.map(c=>c[0]),ys=coords.map(c=>c[1]);
  const minX=Math.min(...xs), maxX=Math.max(...xs);
  const minY=Math.min(...ys), maxY=Math.max(...ys);
  const sx=x=>pad+((x-minX)/(maxX-minX||1))*(W-pad*2);
  const sy=y=>pad+((y-minY)/(maxY-minY||1))*(H-pad*2);
  const svgNS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(svgNS,"svg");
  svg.setAttribute("width",W); svg.setAttribute("height",H); svg.style.border="1px solid #ddd";

  for(let i=0;i<route.length;i++){
    const a=coords[route[i]], b=coords[route[(i+1)%route.length]];
    const line=document.createElementNS(svgNS,"line");
    line.setAttribute("x1",sx(a[0])); line.setAttribute("y1",sy(a[1]));
    line.setAttribute("x2",sx(b[0])); line.setAttribute("y2",sy(b[1]));
    line.setAttribute("stroke","#2b8cbe"); line.setAttribute("stroke-width",2);
    svg.appendChild(line);
  }

  coords.forEach(p=>{
    const circle=document.createElementNS(svgNS,"circle");
    circle.setAttribute("cx",sx(p[0])); circle.setAttribute("cy",sy(p[1]));
    circle.setAttribute("r",4); circle.setAttribute("fill","#f03b20");
    svg.appendChild(circle);
  });

  viz.appendChild(svg);
}

// TSP Pie chart (leg distances)
function drawTspPie(coords, route){
  const viz=document.getElementById('extraOutputs'); viz.innerHTML="";
  const lengths=[]; for(let i=0;i<route.length;i++){ const a=coords[route[i]],b=coords[route[(i+1)%route.length]]; lengths.push(Math.hypot(b[0]-a[0],b[1]-a[1])); }
  const canvas=document.createElement('canvas'); viz.appendChild(canvas);
  new Chart(canvas.getContext('2d'), {
    type:'pie',
    data:{labels:route.map((r,i)=>`Leg ${i+1}`), datasets:[{data:lengths, backgroundColor: route.map((_,i)=>`hsl(${i*360/route.length},70%,50%)`)}]},
    options:{plugins:{legend:{position:'bottom'}, datalabels:{color:'#000', formatter:v=>v.toFixed(2)}}},
    plugins:[ChartDataLabels]
  });
}

// Knapsack Pie chart
function drawKnapsackPie(items, selected){
  const viz=document.getElementById('viz'); viz.innerHTML="";
  const canvas=document.createElement('canvas'); viz.appendChild(canvas);
  const selectedValue = items.filter(i=>selected.includes(i.id)).reduce((s,i)=>s+i.value,0);
  const unselectedValue = items.filter(i=>!selected.includes(i.id)).reduce((s,i)=>s+i.value,0);
  new Chart(canvas.getContext('2d'), {
    type:'pie',
    data:{labels:['Selected','Unselected'], datasets:[{data:[selectedValue,unselectedValue], backgroundColor:['#2b8cbe','#ddd']}]},
    options:{plugins:{legend:{position:'bottom'}, datalabels:{color:'#000', formatter:v=>v}}},
    plugins:[ChartDataLabels]
  });
}

// Run button
document.getElementById("runBtn").onclick = async () => {
  const problem=document.getElementById("problem").value;
  const method=document.getElementById("method").value;
  const dataset=document.getElementById("dataset").value;
  const result=await postRun(problem, method, dataset);

  if(result.error){ alert(result.error); return; }

  showSummary(result);
  createOrUpdateCharts(result);
  document.getElementById("downloadBtn").disabled = false;
  window.lastResultFile = result.result_file;

  if(problem==='tsp' && result.solution.route){
    const resp=await fetch(`/data/tsp/${dataset}.csv`);
    const txt=await resp.text();
    const coords=txt.trim().split("\n").map(l=>l.split(",").map(Number));
    drawTsp(coords,result.solution.route);
    drawTspPie(coords,result.solution.route);
  } else if(problem==='knapsack' && result.solution.selected){
    drawKnapsackPie(result.solution.items,result.solution.selected);
  }
};

// Download button
document.getElementById("downloadBtn").onclick = () => {
  if(!window.lastResultFile) return;
  const a = document.createElement('a');
  a.href = `/download/${window.lastResultFile}`;
  a.download = window.lastResultFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
