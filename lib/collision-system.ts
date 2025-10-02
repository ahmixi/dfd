interface CollisionShape {
  type: 'circle' | 'rectangle' | 'polygon';
  points: { x: number; y: number }[];
  radius?: number;
}

export class CollisionSystem {
  static checkCollision(entityA: any, entityB: any, shapeA: CollisionShape, shapeB: CollisionShape): boolean {
    if (shapeA.type === 'circle' && shapeB.type === 'circle') {
      return this.circleCircleCollision(
        { x: entityA.x, y: entityA.y, radius: shapeA.radius! },
        { x: entityB.x, y: entityB.y, radius: shapeB.radius! }
      );
    }

    if (shapeA.type === 'rectangle' && shapeB.type === 'rectangle') {
      return this.rectRectCollision(
        { x: entityA.x, y: entityA.y, width: entityA.width, height: entityA.height },
        { x: entityB.x, y: entityB.y, width: entityB.width, height: entityB.height }
      );
    }

    // Polygon collision for complex shapes
    if (shapeA.type === 'polygon' && shapeB.type === 'polygon') {
      return this.polygonPolygonCollision(
        this.transformPoints(shapeA.points, entityA),
        this.transformPoints(shapeB.points, entityB)
      );
    }

    return false;
  }

  private static circleCircleCollision(circleA: { x: number; y: number; radius: number }, 
                                     circleB: { x: number; y: number; radius: number }): boolean {
    const dx = circleA.x - circleB.x;
    const dy = circleA.y - circleB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circleA.radius + circleB.radius;
  }

  private static rectRectCollision(rectA: { x: number; y: number; width: number; height: number },
                                 rectB: { x: number; y: number; width: number; height: number }): boolean {
    return rectA.x < rectB.x + rectB.width &&
           rectA.x + rectA.width > rectB.x &&
           rectA.y < rectB.y + rectB.height &&
           rectA.y + rectA.height > rectB.y;
  }

  private static transformPoints(points: { x: number; y: number }[], entity: any): { x: number; y: number }[] {
    return points.map(point => ({
      x: point.x + entity.x,
      y: point.y + entity.y
    }));
  }

  private static polygonPolygonCollision(pointsA: { x: number; y: number }[],
                                       pointsB: { x: number; y: number }[]): boolean {
    // Separating Axis Theorem (SAT)
    const edges = this.getEdges(pointsA).concat(this.getEdges(pointsB));
    
    for (const edge of edges) {
      const axis = this.normalize({ x: -edge.y, y: edge.x });
      const projectionA = this.projectPolygon(pointsA, axis);
      const projectionB = this.projectPolygon(pointsB, axis);
      
      if (!this.overlaps(projectionA, projectionB)) {
        return false;
      }
    }
    
    return true;
  }

  private static getEdges(points: { x: number; y: number }[]): { x: number; y: number }[] {
    const edges = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      edges.push({ x: p2.x - p1.x, y: p2.y - p1.y });
    }
    return edges;
  }

  private static normalize(vector: { x: number; y: number }): { x: number; y: number } {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    return { x: vector.x / length, y: vector.y / length };
  }

  private static projectPolygon(points: { x: number; y: number }[],
                              axis: { x: number; y: number }): { min: number; max: number } {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    
    for (const point of points) {
      const projection = point.x * axis.x + point.y * axis.y;
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    }
    
    return { min, max };
  }

  private static overlaps(projectionA: { min: number; max: number },
                         projectionB: { min: number; max: number }): boolean {
    return projectionA.min <= projectionB.max && projectionB.min <= projectionA.max;
  }
}