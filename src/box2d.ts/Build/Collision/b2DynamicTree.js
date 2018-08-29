/*
* Copyright (c) 2009 Erin Catto http://www.box2d.org
*
* This software is provided 'as-is', without any express or implied
* warranty.  In no event will the authors be held liable for any damages
* arising from the use of this software.
* Permission is granted to anyone to use this software for any purpose,
* including commercial applications, and to alter it and redistribute it
* freely, subject to the following restrictions:
* 1. The origin of this software must not be misrepresented; you must not
* claim that you wrote the original software. If you use this software
* in a product, an acknowledgment in the product documentation would be
* appreciated but is not required.
* 2. Altered source versions must be plainly marked as such, and must not be
* misrepresented as being the original software.
* 3. This notice may not be removed or altered from any source distribution.
*/
// DEBUG: import { b2Assert } from "../Common/b2Settings";
import { b2_aabbExtension, b2_aabbMultiplier } from "../Common/b2Settings";
import { b2Abs, b2Min, b2Max, b2Vec2 } from "../Common/b2Math";
import { b2GrowableStack } from "../Common/b2GrowableStack";
import { b2AABB, b2RayCastInput, b2TestOverlapAABB } from "./b2Collision";
function verify(value) {
    if (value === null) {
        throw new Error();
    }
    return value;
}
/// A node in the dynamic tree. The client does not interact with this directly.
export class b2TreeNode {
    constructor(id = 0) {
        this.m_id = 0;
        this.aabb = new b2AABB();
        this.parent = null; // or next
        this.child1 = null;
        this.child2 = null;
        this.height = 0; // leaf = 0, free node = -1
        this.m_id = id;
    }
    IsLeaf() {
        return this.child1 === null;
    }
}
export class b2DynamicTree {
    constructor() {
        this.m_root = null;
        // b2TreeNode* public m_nodes;
        // int32 public m_nodeCount;
        // int32 public m_nodeCapacity;
        this.m_freeList = null;
        this.m_path = 0;
        this.m_insertionCount = 0;
        this.m_stack = new b2GrowableStack(256);
    }
    // public GetUserData(proxy: b2TreeNode<T>): any {
    //   // DEBUG: b2Assert(proxy !== null);
    //   return proxy.userData;
    // }
    // public GetFatAABB(proxy: b2TreeNode<T>): b2AABB {
    //   // DEBUG: b2Assert(proxy !== null);
    //   return proxy.aabb;
    // }
    Query(aabb, callback) {
        if (this.m_root === null) {
            return;
        }
        const stack = this.m_stack.Reset();
        stack.Push(this.m_root);
        while (stack.GetCount() > 0) {
            const node = stack.Pop();
            // if (node === null) {
            //   continue;
            // }
            if (node.aabb.TestOverlap(aabb)) {
                if (node.IsLeaf()) {
                    const proceed = callback(node);
                    if (!proceed) {
                        return;
                    }
                }
                else {
                    stack.Push(verify(node.child1));
                    stack.Push(verify(node.child2));
                }
            }
        }
    }
    QueryPoint(point, callback) {
        if (this.m_root === null) {
            return;
        }
        const stack = this.m_stack.Reset();
        stack.Push(this.m_root);
        while (stack.GetCount() > 0) {
            const node = stack.Pop();
            // if (node === null) {
            //   continue;
            // }
            if (node.aabb.TestContain(point)) {
                if (node.IsLeaf()) {
                    const proceed = callback(node);
                    if (!proceed) {
                        return;
                    }
                }
                else {
                    stack.Push(verify(node.child1));
                    stack.Push(verify(node.child2));
                }
            }
        }
    }
    RayCast(input, callback) {
        if (this.m_root === null) {
            return;
        }
        const p1 = input.p1;
        const p2 = input.p2;
        const r = b2Vec2.SubVV(p2, p1, b2DynamicTree.s_r);
        // DEBUG: b2Assert(r.LengthSquared() > 0);
        r.Normalize();
        // v is perpendicular to the segment.
        const v = b2Vec2.CrossOneV(r, b2DynamicTree.s_v);
        const abs_v = b2Vec2.AbsV(v, b2DynamicTree.s_abs_v);
        // Separating axis for segment (Gino, p80).
        // |dot(v, p1 - c)| > dot(|v|, h)
        let maxFraction = input.maxFraction;
        // Build a bounding box for the segment.
        const segmentAABB = b2DynamicTree.s_segmentAABB;
        let t_x = p1.x + maxFraction * (p2.x - p1.x);
        let t_y = p1.y + maxFraction * (p2.y - p1.y);
        segmentAABB.lowerBound.x = b2Min(p1.x, t_x);
        segmentAABB.lowerBound.y = b2Min(p1.y, t_y);
        segmentAABB.upperBound.x = b2Max(p1.x, t_x);
        segmentAABB.upperBound.y = b2Max(p1.y, t_y);
        const stack = this.m_stack.Reset();
        stack.Push(this.m_root);
        while (stack.GetCount() > 0) {
            const node = stack.Pop();
            // if (node === null) {
            //   continue;
            // }
            if (!b2TestOverlapAABB(node.aabb, segmentAABB)) {
                continue;
            }
            // Separating axis for segment (Gino, p80).
            // |dot(v, p1 - c)| > dot(|v|, h)
            const c = node.aabb.GetCenter();
            const h = node.aabb.GetExtents();
            const separation = b2Abs(b2Vec2.DotVV(v, b2Vec2.SubVV(p1, c, b2Vec2.s_t0))) - b2Vec2.DotVV(abs_v, h);
            if (separation > 0) {
                continue;
            }
            if (node.IsLeaf()) {
                const subInput = b2DynamicTree.s_subInput;
                subInput.p1.Copy(input.p1);
                subInput.p2.Copy(input.p2);
                subInput.maxFraction = maxFraction;
                const value = callback(subInput, node);
                if (value === 0) {
                    // The client has terminated the ray cast.
                    return;
                }
                if (value > 0) {
                    // Update segment bounding box.
                    maxFraction = value;
                    t_x = p1.x + maxFraction * (p2.x - p1.x);
                    t_y = p1.y + maxFraction * (p2.y - p1.y);
                    segmentAABB.lowerBound.x = b2Min(p1.x, t_x);
                    segmentAABB.lowerBound.y = b2Min(p1.y, t_y);
                    segmentAABB.upperBound.x = b2Max(p1.x, t_x);
                    segmentAABB.upperBound.y = b2Max(p1.y, t_y);
                }
            }
            else {
                stack.Push(verify(node.child1));
                stack.Push(verify(node.child2));
            }
        }
    }
    AllocateNode() {
        // Expand the node pool as needed.
        if (this.m_freeList) {
            const node = this.m_freeList;
            this.m_freeList = node.parent; // this.m_freeList = node.next;
            node.parent = null;
            node.child1 = null;
            node.child2 = null;
            node.height = 0;
            delete node.userData; // = null;
            return node;
        }
        return new b2TreeNode(b2DynamicTree.s_node_id++);
    }
    FreeNode(node) {
        node.parent = this.m_freeList; // node.next = this.m_freeList;
        node.child1 = null;
        node.child2 = null;
        node.height = -1;
        delete node.userData; // = null;
        this.m_freeList = node;
    }
    CreateProxy(aabb, userData) {
        const node = this.AllocateNode();
        // Fatten the aabb.
        const r_x = b2_aabbExtension;
        const r_y = b2_aabbExtension;
        node.aabb.lowerBound.x = aabb.lowerBound.x - r_x;
        node.aabb.lowerBound.y = aabb.lowerBound.y - r_y;
        node.aabb.upperBound.x = aabb.upperBound.x + r_x;
        node.aabb.upperBound.y = aabb.upperBound.y + r_y;
        node.userData = userData;
        node.height = 0;
        this.InsertLeaf(node);
        return node;
    }
    DestroyProxy(proxy) {
        // DEBUG: b2Assert(proxy.IsLeaf());
        this.RemoveLeaf(proxy);
        this.FreeNode(proxy);
    }
    MoveProxy(proxy, aabb, displacement) {
        // DEBUG: b2Assert(proxy.IsLeaf());
        if (proxy.aabb.Contains(aabb)) {
            return false;
        }
        this.RemoveLeaf(proxy);
        // Extend AABB.
        // Predict AABB displacement.
        const r_x = b2_aabbExtension + b2_aabbMultiplier * (displacement.x > 0 ? displacement.x : (-displacement.x));
        const r_y = b2_aabbExtension + b2_aabbMultiplier * (displacement.y > 0 ? displacement.y : (-displacement.y));
        proxy.aabb.lowerBound.x = aabb.lowerBound.x - r_x;
        proxy.aabb.lowerBound.y = aabb.lowerBound.y - r_y;
        proxy.aabb.upperBound.x = aabb.upperBound.x + r_x;
        proxy.aabb.upperBound.y = aabb.upperBound.y + r_y;
        this.InsertLeaf(proxy);
        return true;
    }
    InsertLeaf(leaf) {
        ++this.m_insertionCount;
        if (this.m_root === null) {
            this.m_root = leaf;
            this.m_root.parent = null;
            return;
        }
        // Find the best sibling for this node
        const leafAABB = leaf.aabb;
        ///const center: b2Vec2 = leafAABB.GetCenter();
        let index = this.m_root;
        while (!index.IsLeaf()) {
            const child1 = verify(index.child1);
            const child2 = verify(index.child2);
            const area = index.aabb.GetPerimeter();
            const combinedAABB = b2DynamicTree.s_combinedAABB;
            combinedAABB.Combine2(index.aabb, leafAABB);
            const combinedArea = combinedAABB.GetPerimeter();
            // Cost of creating a new parent for this node and the new leaf
            const cost = 2 * combinedArea;
            // Minimum cost of pushing the leaf further down the tree
            const inheritanceCost = 2 * (combinedArea - area);
            // Cost of descending into child1
            let cost1;
            const aabb = b2DynamicTree.s_aabb;
            let oldArea;
            let newArea;
            if (child1.IsLeaf()) {
                aabb.Combine2(leafAABB, child1.aabb);
                cost1 = aabb.GetPerimeter() + inheritanceCost;
            }
            else {
                aabb.Combine2(leafAABB, child1.aabb);
                oldArea = child1.aabb.GetPerimeter();
                newArea = aabb.GetPerimeter();
                cost1 = (newArea - oldArea) + inheritanceCost;
            }
            // Cost of descending into child2
            let cost2;
            if (child2.IsLeaf()) {
                aabb.Combine2(leafAABB, child2.aabb);
                cost2 = aabb.GetPerimeter() + inheritanceCost;
            }
            else {
                aabb.Combine2(leafAABB, child2.aabb);
                oldArea = child2.aabb.GetPerimeter();
                newArea = aabb.GetPerimeter();
                cost2 = newArea - oldArea + inheritanceCost;
            }
            // Descend according to the minimum cost.
            if (cost < cost1 && cost < cost2) {
                break;
            }
            // Descend
            if (cost1 < cost2) {
                index = child1;
            }
            else {
                index = child2;
            }
        }
        const sibling = index;
        // Create a parent for the siblings.
        const oldParent = sibling.parent;
        const newParent = this.AllocateNode();
        newParent.parent = oldParent;
        delete newParent.userData; // = null;
        newParent.aabb.Combine2(leafAABB, sibling.aabb);
        newParent.height = sibling.height + 1;
        if (oldParent) {
            // The sibling was not the root.
            if (oldParent.child1 === sibling) {
                oldParent.child1 = newParent;
            }
            else {
                oldParent.child2 = newParent;
            }
            newParent.child1 = sibling;
            newParent.child2 = leaf;
            sibling.parent = newParent;
            leaf.parent = newParent;
        }
        else {
            // The sibling was the root.
            newParent.child1 = sibling;
            newParent.child2 = leaf;
            sibling.parent = newParent;
            leaf.parent = newParent;
            this.m_root = newParent;
        }
        // Walk back up the tree fixing heights and AABBs
        let index2 = leaf.parent;
        while (index2 !== null) {
            index2 = this.Balance(index2);
            const child1 = verify(index2.child1);
            const child2 = verify(index2.child2);
            index2.height = 1 + b2Max(child1.height, child2.height);
            index2.aabb.Combine2(child1.aabb, child2.aabb);
            index2 = index2.parent;
        }
        // this.Validate();
    }
    RemoveLeaf(leaf) {
        if (leaf === this.m_root) {
            this.m_root = null;
            return;
        }
        const parent = verify(leaf.parent);
        const grandParent = parent && parent.parent;
        let sibling;
        if (parent.child1 === leaf) {
            sibling = verify(parent.child2);
        }
        else {
            sibling = verify(parent.child1);
        }
        if (grandParent) {
            // Destroy parent and connect sibling to grandParent.
            if (grandParent.child1 === parent) {
                grandParent.child1 = sibling;
            }
            else {
                grandParent.child2 = sibling;
            }
            sibling.parent = grandParent;
            this.FreeNode(parent);
            // Adjust ancestor bounds.
            let index = grandParent;
            while (index) {
                index = this.Balance(index);
                const child1 = verify(index.child1);
                const child2 = verify(index.child2);
                index.aabb.Combine2(child1.aabb, child2.aabb);
                index.height = 1 + b2Max(child1.height, child2.height);
                index = index.parent;
            }
        }
        else {
            this.m_root = sibling;
            sibling.parent = null;
            this.FreeNode(parent);
        }
        // this.Validate();
    }
    Balance(A) {
        // DEBUG: b2Assert(A !== null);
        if (A.IsLeaf() || A.height < 2) {
            return A;
        }
        const B = verify(A.child1);
        const C = verify(A.child2);
        const balance = C.height - B.height;
        // Rotate C up
        if (balance > 1) {
            const F = verify(C.child1);
            const G = verify(C.child2);
            // Swap A and C
            C.child1 = A;
            C.parent = A.parent;
            A.parent = C;
            // A's old parent should point to C
            if (C.parent !== null) {
                if (C.parent.child1 === A) {
                    C.parent.child1 = C;
                }
                else {
                    // DEBUG: b2Assert(C.parent.child2 === A);
                    C.parent.child2 = C;
                }
            }
            else {
                this.m_root = C;
            }
            // Rotate
            if (F.height > G.height) {
                C.child2 = F;
                A.child2 = G;
                G.parent = A;
                A.aabb.Combine2(B.aabb, G.aabb);
                C.aabb.Combine2(A.aabb, F.aabb);
                A.height = 1 + b2Max(B.height, G.height);
                C.height = 1 + b2Max(A.height, F.height);
            }
            else {
                C.child2 = G;
                A.child2 = F;
                F.parent = A;
                A.aabb.Combine2(B.aabb, F.aabb);
                C.aabb.Combine2(A.aabb, G.aabb);
                A.height = 1 + b2Max(B.height, F.height);
                C.height = 1 + b2Max(A.height, G.height);
            }
            return C;
        }
        // Rotate B up
        if (balance < -1) {
            const D = verify(B.child1);
            const E = verify(B.child2);
            // Swap A and B
            B.child1 = A;
            B.parent = A.parent;
            A.parent = B;
            // A's old parent should point to B
            if (B.parent !== null) {
                if (B.parent.child1 === A) {
                    B.parent.child1 = B;
                }
                else {
                    // DEBUG: b2Assert(B.parent.child2 === A);
                    B.parent.child2 = B;
                }
            }
            else {
                this.m_root = B;
            }
            // Rotate
            if (D.height > E.height) {
                B.child2 = D;
                A.child1 = E;
                E.parent = A;
                A.aabb.Combine2(C.aabb, E.aabb);
                B.aabb.Combine2(A.aabb, D.aabb);
                A.height = 1 + b2Max(C.height, E.height);
                B.height = 1 + b2Max(A.height, D.height);
            }
            else {
                B.child2 = E;
                A.child1 = D;
                D.parent = A;
                A.aabb.Combine2(C.aabb, D.aabb);
                B.aabb.Combine2(A.aabb, E.aabb);
                A.height = 1 + b2Max(C.height, D.height);
                B.height = 1 + b2Max(A.height, E.height);
            }
            return B;
        }
        return A;
    }
    GetHeight() {
        if (this.m_root === null) {
            return 0;
        }
        return this.m_root.height;
    }
    static GetAreaNode(node) {
        if (node === null) {
            return 0;
        }
        if (node.IsLeaf()) {
            return 0;
        }
        let area = node.aabb.GetPerimeter();
        area += b2DynamicTree.GetAreaNode(node.child1);
        area += b2DynamicTree.GetAreaNode(node.child2);
        return area;
    }
    GetAreaRatio() {
        if (this.m_root === null) {
            return 0;
        }
        const root = this.m_root;
        const rootArea = root.aabb.GetPerimeter();
        const totalArea = b2DynamicTree.GetAreaNode(this.m_root);
        /*
        float32 totalArea = 0.0;
        for (int32 i = 0; i < m_nodeCapacity; ++i) {
          const b2TreeNode<T>* node = m_nodes + i;
          if (node.height < 0) {
            // Free node in pool
            continue;
          }
    
          totalArea += node.aabb.GetPerimeter();
        }
        */
        return totalArea / rootArea;
    }
    ComputeHeightNode(node) {
        if (!node || node.IsLeaf()) {
            return 0;
        }
        const height1 = this.ComputeHeightNode(node.child1);
        const height2 = this.ComputeHeightNode(node.child2);
        return 1 + b2Max(height1, height2);
    }
    ComputeHeight() {
        const height = this.ComputeHeightNode(this.m_root);
        return height;
    }
    ValidateStructure(index) {
        if (index === null) {
            return;
        }
        if (index === this.m_root) {
            // DEBUG: b2Assert(index.parent === null);
        }
        const node = index;
        if (node.IsLeaf()) {
            // DEBUG: b2Assert(node.child1 === null);
            // DEBUG: b2Assert(node.child2 === null);
            // DEBUG: b2Assert(node.height === 0);
            return;
        }
        const child1 = verify(node.child1);
        const child2 = verify(node.child2);
        // DEBUG: b2Assert(child1.parent === index);
        // DEBUG: b2Assert(child2.parent === index);
        this.ValidateStructure(child1);
        this.ValidateStructure(child2);
    }
    ValidateMetrics(index) {
        if (index === null) {
            return;
        }
        const node = index;
        if (node.IsLeaf()) {
            // DEBUG: b2Assert(node.child1 === null);
            // DEBUG: b2Assert(node.child2 === null);
            // DEBUG: b2Assert(node.height === 0);
            return;
        }
        const child1 = verify(node.child1);
        const child2 = verify(node.child2);
        // DEBUG: const height1: number = child1.height;
        // DEBUG: const height2: number = child2.height;
        // DEBUG: const height: number = 1 + b2Max(height1, height2);
        // DEBUG: b2Assert(node.height === height);
        const aabb = b2DynamicTree.s_aabb;
        aabb.Combine2(child1.aabb, child2.aabb);
        // DEBUG: b2Assert(aabb.lowerBound === node.aabb.lowerBound);
        // DEBUG: b2Assert(aabb.upperBound === node.aabb.upperBound);
        this.ValidateMetrics(child1);
        this.ValidateMetrics(child2);
    }
    Validate() {
        // DEBUG: this.ValidateStructure(this.m_root);
        // DEBUG: this.ValidateMetrics(this.m_root);
        // let freeCount: number = 0;
        // let freeIndex: b2TreeNode<T> | null = this.m_freeList;
        // while (freeIndex !== null) {
        //   freeIndex = freeIndex.parent; // freeIndex = freeIndex.next;
        //   ++freeCount;
        // }
        // DEBUG: b2Assert(this.GetHeight() === this.ComputeHeight());
        // b2Assert(this.m_nodeCount + freeCount === this.m_nodeCapacity);
    }
    static GetMaxBalanceNode(node, maxBalance) {
        if (node === null) {
            return maxBalance;
        }
        if (node.height <= 1) {
            return maxBalance;
        }
        // DEBUG: b2Assert(!node.IsLeaf());
        const child1 = verify(node.child1);
        const child2 = verify(node.child2);
        const balance = b2Abs(child2.height - child1.height);
        return b2Max(maxBalance, balance);
    }
    GetMaxBalance() {
        const maxBalance = b2DynamicTree.GetMaxBalanceNode(this.m_root, 0);
        /*
        int32 maxBalance = 0;
        for (int32 i = 0; i < m_nodeCapacity; ++i) {
          const b2TreeNode<T>* node = m_nodes + i;
          if (node.height <= 1) {
            continue;
          }
    
          b2Assert(!node.IsLeaf());
    
          int32 child1 = node.child1;
          int32 child2 = node.child2;
          int32 balance = b2Abs(m_nodes[child2].height - m_nodes[child1].height);
          maxBalance = b2Max(maxBalance, balance);
        }
        */
        return maxBalance;
    }
    RebuildBottomUp() {
        /*
        int32* nodes = (int32*)b2Alloc(m_nodeCount * sizeof(int32));
        int32 count = 0;
    
        // Build array of leaves. Free the rest.
        for (int32 i = 0; i < m_nodeCapacity; ++i) {
          if (m_nodes[i].height < 0) {
            // free node in pool
            continue;
          }
    
          if (m_nodes[i].IsLeaf()) {
            m_nodes[i].parent = b2_nullNode;
            nodes[count] = i;
            ++count;
          } else {
            FreeNode(i);
          }
        }
    
        while (count > 1) {
          float32 minCost = b2_maxFloat;
          int32 iMin = -1, jMin = -1;
          for (int32 i = 0; i < count; ++i) {
            b2AABB aabbi = m_nodes[nodes[i]].aabb;
    
            for (int32 j = i + 1; j < count; ++j) {
              b2AABB aabbj = m_nodes[nodes[j]].aabb;
              b2AABB b;
              b.Combine(aabbi, aabbj);
              float32 cost = b.GetPerimeter();
              if (cost < minCost) {
                iMin = i;
                jMin = j;
                minCost = cost;
              }
            }
          }
    
          int32 index1 = nodes[iMin];
          int32 index2 = nodes[jMin];
          b2TreeNode<T>* child1 = m_nodes + index1;
          b2TreeNode<T>* child2 = m_nodes + index2;
    
          int32 parentIndex = AllocateNode();
          b2TreeNode<T>* parent = m_nodes + parentIndex;
          parent.child1 = index1;
          parent.child2 = index2;
          parent.height = 1 + b2Max(child1.height, child2.height);
          parent.aabb.Combine(child1.aabb, child2.aabb);
          parent.parent = b2_nullNode;
    
          child1.parent = parentIndex;
          child2.parent = parentIndex;
    
          nodes[jMin] = nodes[count-1];
          nodes[iMin] = parentIndex;
          --count;
        }
    
        m_root = nodes[0];
        b2Free(nodes);
        */
        this.Validate();
    }
    static ShiftOriginNode(node, newOrigin) {
        if (node === null) {
            return;
        }
        if (node.height <= 1) {
            return;
        }
        // DEBUG: b2Assert(!node.IsLeaf());
        const child1 = node.child1;
        const child2 = node.child2;
        b2DynamicTree.ShiftOriginNode(child1, newOrigin);
        b2DynamicTree.ShiftOriginNode(child2, newOrigin);
        node.aabb.lowerBound.SelfSub(newOrigin);
        node.aabb.upperBound.SelfSub(newOrigin);
    }
    ShiftOrigin(newOrigin) {
        b2DynamicTree.ShiftOriginNode(this.m_root, newOrigin);
        /*
        // Build array of leaves. Free the rest.
        for (int32 i = 0; i < m_nodeCapacity; ++i) {
          m_nodes[i].aabb.lowerBound -= newOrigin;
          m_nodes[i].aabb.upperBound -= newOrigin;
        }
        */
    }
}
b2DynamicTree.s_r = new b2Vec2();
b2DynamicTree.s_v = new b2Vec2();
b2DynamicTree.s_abs_v = new b2Vec2();
b2DynamicTree.s_segmentAABB = new b2AABB();
b2DynamicTree.s_subInput = new b2RayCastInput();
b2DynamicTree.s_combinedAABB = new b2AABB();
b2DynamicTree.s_aabb = new b2AABB();
b2DynamicTree.s_node_id = 0;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJEeW5hbWljVHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0NvbGxpc2lvbi9iMkR5bmFtaWNUcmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsMERBQTBEO0FBQzFELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQzNFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQU0sTUFBTSxrQkFBa0IsQ0FBQztBQUNuRSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDNUQsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFMUUsU0FBUyxNQUFNLENBQUksS0FBZTtJQUNoQyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFBRSxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7S0FBRTtJQUMxQyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxnRkFBZ0Y7QUFDaEYsTUFBTSxPQUFPLFVBQVU7SUFTckIsWUFBWSxLQUFhLENBQUM7UUFSbkIsU0FBSSxHQUFXLENBQUMsQ0FBQztRQUNSLFNBQUksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBRXJDLFdBQU0sR0FBeUIsSUFBSSxDQUFDLENBQUMsVUFBVTtRQUMvQyxXQUFNLEdBQXlCLElBQUksQ0FBQztRQUNwQyxXQUFNLEdBQXlCLElBQUksQ0FBQztRQUNwQyxXQUFNLEdBQVcsQ0FBQyxDQUFDLENBQUMsMkJBQTJCO1FBR3BELElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFTSxNQUFNO1FBQ1gsT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQztJQUM5QixDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8s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