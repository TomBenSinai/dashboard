import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import './App.css';

const COLORS = {
  good: '#4caf50',
  warning: '#ff9800',
  critical: '#f44336',
  unknown: '#9c27b0'
};

const metrics = [
  { name: 'CPU Usage', type: 'lineChart', size: 'large', threshold: { warning: 70, critical: 90 } },
  { name: 'Memory Usage', type: 'percentage', size: 'small', threshold: { warning: 80, critical: 95 } },
  { name: 'Network Traffic', type: 'barChart', size: 'medium' },
  { name: 'Disk I/O', type: 'lineChart', size: 'medium' },
  { name: 'Active Connections', type: 'number', size: 'small', threshold: { warning: 1000, critical: 5000 } },
  { name: 'Response Time', type: 'lineChart', size: 'medium', threshold: { warning: 200, critical: 500 } },
  { name: 'Error Rate', type: 'percentage', size: 'small', threshold: { warning: 5, critical: 10 } },
  { name: 'Server Status', type: 'pieChart', size: 'medium' },
  { name: 'Database Queries', type: 'number', size: 'small', threshold: { warning: 5000, critical: 10000 } },
  { name: 'Cache Hit Rate', type: 'percentage', size: 'small', threshold: { warning: 80, critical: 60, inverse: true } },
  { name: 'API Calls', type: 'barChart', size: 'large' },
];

const timeScales = {
  minute: { unit: 'minute', count: 60, format: 'HH:mm' },
  hour: { unit: 'hour', count: 24, format: 'HH:00' },
  day: { unit: 'day', count: 30, format: 'MM-DD' },
};

function generateInitialData(timeScale) {
  const now = new Date();
  return {
    'CPU Usage': Array.from({length: timeScale.count}, (_, i) => ({ 
      time: new Date(now - (timeScale.count - 1 - i) * getMilliseconds(timeScale.unit)),
      value: Math.floor(Math.random() * 100)
    })),
    'Memory Usage': 65,
    'Network Traffic': ['In', 'Out'].map(direction => ({ name: direction, value: Math.floor(Math.random() * 1000) })),
    'Disk I/O': Array.from({length: timeScale.count}, (_, i) => ({ 
      time: new Date(now - (timeScale.count - 1 - i) * getMilliseconds(timeScale.unit)),
      value: Math.floor(Math.random() * 100)
    })),
    'Active Connections': 500,
    'Response Time': Array.from({length: timeScale.count}, (_, i) => ({ 
      time: new Date(now - (timeScale.count - 1 - i) * getMilliseconds(timeScale.unit)),
      value: Math.floor(Math.random() * 1000)
    })),
    'Error Rate': 2.5,
    'Server Status': [
      { name: 'Online', value: 8 },
      { name: 'Offline', value: 1 },
      { name: 'Maintenance', value: 1 },
    ],
    'Database Queries': 3000,
    'Cache Hit Rate': 90,
    'API Calls': ['GET', 'POST', 'PUT', 'DELETE'].map(method => ({ name: method, value: Math.floor(Math.random() * 1000) })),
  };
}

function getMilliseconds(unit) {
  switch(unit) {
    case 'minute': return 60 * 1000;
    case 'hour': return 60 * 60 * 1000;
    case 'day': return 24 * 60 * 60 * 1000;
    default: return 1000;
  }
}

function Dashboard() {
  const [timeScale, setTimeScale] = useState(timeScales.minute);
  const [data, setData] = useState(generateInitialData(timeScale));
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState({});

  function updateData(prevData) {
    const newData = { ...prevData };
    const now = new Date();
    
    metrics.forEach(metric => {
      switch (metric.type) {
        case 'number':
        case 'percentage':
          newData[metric.name] = Math.max(0, Math.min(100, prevData[metric.name] + (Math.random() * 10 - 5)));
          break;
        case 'lineChart':
          newData[metric.name] = [
            ...prevData[metric.name].slice(1),
            { time: now, value: Math.max(0, prevData[metric.name][prevData[metric.name].length - 1].value + (Math.random() * 20 - 10)) }
          ];
          break;
        case 'barChart':
          newData[metric.name] = prevData[metric.name].map(item => ({
            ...item,
            value: Math.max(0, item.value + Math.floor(Math.random() * 201) - 100)
          }));
          break;
        case 'pieChart':
          newData[metric.name] = prevData[metric.name].map(item => ({
            ...item,
            value: Math.max(0, item.value + Math.floor(Math.random() * 3) - 1)
          }));
          break;
        default:
          newData[metric.name] = prevData[metric.name];
      }
    });
    
    return newData;
  }

  useEffect(() => {
    setData(generateInitialData(timeScale));
    setLoading(false);

    const dataInterval = setInterval(() => {
      setData(prevData => updateData(prevData));
    }, 1000); // Update every second for more liveliness

    const reloadInterval = setInterval(() => {
      const metricToReload = metrics[Math.floor(Math.random() * metrics.length)].name;
      setReloading(prev => ({ ...prev, [metricToReload]: true }));
      setTimeout(() => {
        setReloading(prev => ({ ...prev, [metricToReload]: false }));
      }, 1000);
    }, Math.floor(Math.random() * 3000) + 2000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(reloadInterval);
    };
  }, [timeScale]);

  const getStatus = (metric, value) => {
    if (!metric.threshold) return 'unknown';
    if (metric.threshold.inverse) {
      if (value <= metric.threshold.critical) return 'critical';
      if (value <= metric.threshold.warning) return 'warning';
      return 'good';
    } else {
      if (value >= metric.threshold.critical) return 'critical';
      if (value >= metric.threshold.warning) return 'warning';
      return 'good';
    }
  };

  const renderMetricContent = (metric) => {
    if (loading || reloading[metric.name]) {
      return (
        <div className="loading-placeholder">
          <div className="loading-animation"></div>
        </div>
      );
    }

    const metricData = data[metric.name];
    let status = 'unknown';
    let displayValue = null;

    switch (metric.type) {
      case 'number':
        displayValue = Math.round(metricData);
        status = getStatus(metric, displayValue);
        return <p className={`status-${status}`}>{displayValue}</p>;
      case 'percentage':
        displayValue = metricData.toFixed(1);
        status = getStatus(metric, displayValue);
        return <p className={`status-${status}`}>{displayValue}%</p>;
      case 'lineChart':
        const lastValue = metricData[metricData.length - 1].value;
        status = getStatus(metric, lastValue);
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metricData}>
              <XAxis 
                dataKey="time" 
                domain={['auto', 'auto']}
                tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
              <YAxis />
              <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
              <Line type="monotone" dataKey="value" stroke={COLORS[status]} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'barChart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metricData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {metricData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[getStatus(metric, entry.value)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pieChart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={metricData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metricData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name === 'Online' ? 'good' : entry.name === 'Offline' ? 'critical' : 'warning']} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <p>Unknown metric type</p>;
    }
  };

  return (
    <div className="dashboard">
      <h1>System Monitoring Dashboard</h1>
      <div className="time-scale-selector">
        <button onClick={() => setTimeScale(timeScales.minute)} className={timeScale.unit === 'minute' ? 'active' : ''}>Minute</button>
        <button onClick={() => setTimeScale(timeScales.hour)} className={timeScale.unit === 'hour' ? 'active' : ''}>Hour</button>
        <button onClick={() => setTimeScale(timeScales.day)} className={timeScale.unit === 'day' ? 'active' : ''}>Day</button>
      </div>
      <div className="dashboard-content">
        {metrics.map((metric) => (
          <div key={metric.name} className={`metric ${metric.name.toLowerCase().replace(/\s+/g, '-')} ${metric.size}`}>
            <h2>{metric.name}</h2>
            {renderMetricContent(metric)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;