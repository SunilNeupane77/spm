'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMindmapAnalytics } from '@/lib/analyticsHooks';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

export function MindmapRelationships() {
  const { data: mindmapAnalytics, isLoading } = useMindmapAnalytics();
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (isLoading || !mindmapAnalytics || !svgRef.current) return;
    
    // Clear any previous visualization
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Create data structure for visualization
    const courses = mindmapAnalytics.mindmapsByCourse || [];
    const mindmaps = mindmapAnalytics.recentMindmaps || [];
    
    // Define nodes and links for our graph
    const nodes = [];
    const links = [];
    
    // Add course nodes
    courses.forEach(course => {
      nodes.push({
        id: `course-${course.courseId}`,
        name: course.courseCode,
        type: 'course',
        color: course.color || '#3498db',
        value: course.mindmapsCount + 5
      });
    });
    
    // Add mindmap nodes and create links to courses
    mindmaps.forEach((mindmap, index) => {
      nodes.push({
        id: `mindmap-${mindmap.id}`,
        name: mindmap.title,
        type: 'mindmap',
        color: '#9c88ff',
        value: mindmap.nodeCount + 3
      });
      
      // Create link to course if exists
      if (mindmap.course) {
        links.push({
          source: `mindmap-${mindmap.id}`,
          target: `course-${mindmap.course.id}`,
          value: 2
        });
      }
    });
    
    // Add node type nodes for connections
    const nodeTypes = Object.keys(mindmapAnalytics.nodeTypeDistribution || {});
    nodeTypes.forEach(type => {
      const count = mindmapAnalytics.nodeTypeDistribution[type];
      nodes.push({
        id: `type-${type}`,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        type: 'nodetype',
        color: '#e74c3c',
        value: count + 2
      });
      
      // Link mindmaps to their node types
      mindmaps.forEach(mindmap => {
        links.push({
          source: `mindmap-${mindmap.id}`,
          target: `type-${type}`,
          value: 1
        });
      });
    });
    
    // Set up the force simulation
    const width = svgRef.current.clientWidth;
    const height = 400;
    
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
    
    // Create a force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.value + 10));
    
    // Create the links
    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));
    
    // Create the nodes
    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.value)
      .attr("fill", d => d.color)
      .call(drag(simulation));
    
    // Add titles/tooltips
    node.append("title")
      .text(d => `${d.name} (${d.type})`);
    
    // Add labels
    const labels = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", d => d.type === 'course' ? "12px" : "10px")
      .attr("fill", "#fff")
      .text(d => d.name.substring(0, 10) + (d.name.length > 10 ? "..." : ""));
    
    // Update positions on each tick of the simulation
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });
    
    // Drag functionality for nodes
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    
    // Cleanup on unmount
    return () => {
      simulation.stop();
    };
  }, [mindmapAnalytics, isLoading]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mind Map Relationships</CardTitle>
        <CardDescription>Interactive visualization of mind maps and their connections</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <svg ref={svgRef} width="100%" height="100%" />
        )}
      </CardContent>
    </Card>
  );
}
