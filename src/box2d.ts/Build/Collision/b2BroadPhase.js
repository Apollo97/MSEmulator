/*
* Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
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
import { b2DynamicTree } from "./b2DynamicTree";
export class b2Pair {
    constructor(proxyA, proxyB) {
        this.proxyA = proxyA;
        this.proxyB = proxyB;
    }
}
/// The broad-phase is used for computing pairs and performing volume queries and ray casts.
/// This broad-phase does not persist pairs. Instead, this reports potentially new pairs.
/// It is up to the client to consume the new pairs and to track subsequent overlap.
export class b2BroadPhase {
    constructor() {
        this.m_tree = new b2DynamicTree();
        this.m_proxyCount = 0;
        // public m_moveCapacity: number = 16;
        this.m_moveCount = 0;
        this.m_moveBuffer = [];
        // public m_pairCapacity: number = 16;
        this.m_pairCount = 0;
        this.m_pairBuffer = [];
    }
    // public m_queryProxyId: number = 0;
    /// Create a proxy with an initial AABB. Pairs are not reported until
    /// UpdatePairs is called.
    CreateProxy(aabb, userData) {
        const proxy = this.m_tree.CreateProxy(aabb, userData);
        ++this.m_proxyCount;
        this.BufferMove(proxy);
        return proxy;
    }
    /// Destroy a proxy. It is up to the client to remove any pairs.
    DestroyProxy(proxy) {
        this.UnBufferMove(proxy);
        --this.m_proxyCount;
        this.m_tree.DestroyProxy(proxy);
    }
    /// Call MoveProxy as many times as you like, then when you are done
    /// call UpdatePairs to finalized the proxy pairs (for your time step).
    MoveProxy(proxy, aabb, displacement) {
        const buffer = this.m_tree.MoveProxy(proxy, aabb, displacement);
        if (buffer) {
            this.BufferMove(proxy);
        }
    }
    /// Call to trigger a re-processing of it's pairs on the next call to UpdatePairs.
    TouchProxy(proxy) {
        this.BufferMove(proxy);
    }
    /// Get the fat AABB for a proxy.
    // public GetFatAABB(proxy: b2TreeNode<T>): b2AABB {
    //   return this.m_tree.GetFatAABB(proxy);
    // }
    /// Get user data from a proxy. Returns NULL if the id is invalid.
    // public GetUserData(proxy: b2TreeNode<T>): T {
    //   return this.m_tree.GetUserData(proxy);
    // }
    /// Test overlap of fat AABBs.
    // public TestOverlap(proxyA: b2TreeNode<T>, proxyB: b2TreeNode<T>): boolean {
    //   const aabbA: b2AABB = this.m_tree.GetFatAABB(proxyA);
    //   const aabbB: b2AABB = this.m_tree.GetFatAABB(proxyB);
    //   return b2TestOverlapAABB(aabbA, aabbB);
    // }
    /// Get the number of proxies.
    GetProxyCount() {
        return this.m_proxyCount;
    }
    /// Update the pairs. This results in pair callbacks. This can only add pairs.
    UpdatePairs(callback) {
        // Reset pair buffer
        this.m_pairCount = 0;
        // Perform tree queries for all moving proxies.
        for (let i = 0; i < this.m_moveCount; ++i) {
            const queryProxy = this.m_moveBuffer[i];
            if (queryProxy === null) {
                continue;
            }
            // This is called from box2d.b2DynamicTree::Query when we are gathering pairs.
            // boolean b2BroadPhase::QueryCallback(int32 proxyId);
            // We have to query the tree with the fat AABB so that
            // we don't fail to create a pair that may touch later.
            const fatAABB = queryProxy.aabb; // this.m_tree.GetFatAABB(queryProxy);
            // Query tree, create pairs and add them pair buffer.
            this.m_tree.Query(fatAABB, (proxy) => {
                // A proxy cannot form a pair with itself.
                if (proxy.m_id === queryProxy.m_id) {
                    return true;
                }
                // const proxyA = proxy < queryProxy ? proxy : queryProxy;
                // const proxyB = proxy >= queryProxy ? proxy : queryProxy;
                let proxyA;
                let proxyB;
                if (proxy.m_id < queryProxy.m_id) {
                    proxyA = proxy;
                    proxyB = queryProxy;
                }
                else {
                    proxyA = queryProxy;
                    proxyB = proxy;
                }
                // Grow the pair buffer as needed.
                if (this.m_pairCount === this.m_pairBuffer.length) {
                    this.m_pairBuffer[this.m_pairCount] = new b2Pair(proxyA, proxyB);
                }
                else {
                    const pair = this.m_pairBuffer[this.m_pairCount];
                    pair.proxyA = proxyA;
                    pair.proxyB = proxyB;
                }
                ++this.m_pairCount;
                return true;
            });
        }
        // Reset move buffer
        this.m_moveCount = 0;
        // Sort the pair buffer to expose duplicates.
        this.m_pairBuffer.length = this.m_pairCount;
        this.m_pairBuffer.sort(b2PairLessThan);
        // Send the pairs back to the client.
        let i = 0;
        while (i < this.m_pairCount) {
            const primaryPair = this.m_pairBuffer[i];
            const userDataA = primaryPair.proxyA.userData; // this.m_tree.GetUserData(primaryPair.proxyA);
            const userDataB = primaryPair.proxyB.userData; // this.m_tree.GetUserData(primaryPair.proxyB);
            callback(userDataA, userDataB);
            ++i;
            // Skip any duplicate pairs.
            while (i < this.m_pairCount) {
                const pair = this.m_pairBuffer[i];
                if (pair.proxyA.m_id !== primaryPair.proxyA.m_id || pair.proxyB.m_id !== primaryPair.proxyB.m_id) {
                    break;
                }
                ++i;
            }
        }
        // Try to keep the tree balanced.
        // this.m_tree.Rebalance(4);
    }
    /// Query an AABB for overlapping proxies. The callback class
    /// is called for each proxy that overlaps the supplied AABB.
    Query(aabb, callback) {
        this.m_tree.Query(aabb, callback);
    }
    QueryPoint(point, callback) {
        this.m_tree.QueryPoint(point, callback);
    }
    /// Ray-cast against the proxies in the tree. This relies on the callback
    /// to perform a exact ray-cast in the case were the proxy contains a shape.
    /// The callback also performs the any collision filtering. This has performance
    /// roughly equal to k * log(n), where k is the number of collisions and n is the
    /// number of proxies in the tree.
    /// @param input the ray-cast input data. The ray extends from p1 to p1 + maxFraction * (p2 - p1).
    /// @param callback a callback class that is called for each proxy that is hit by the ray.
    RayCast(input, callback) {
        this.m_tree.RayCast(input, callback);
    }
    /// Get the height of the embedded tree.
    GetTreeHeight() {
        return this.m_tree.GetHeight();
    }
    /// Get the balance of the embedded tree.
    GetTreeBalance() {
        return this.m_tree.GetMaxBalance();
    }
    /// Get the quality metric of the embedded tree.
    GetTreeQuality() {
        return this.m_tree.GetAreaRatio();
    }
    /// Shift the world origin. Useful for large worlds.
    /// The shift formula is: position -= newOrigin
    /// @param newOrigin the new origin with respect to the old origin
    ShiftOrigin(newOrigin) {
        this.m_tree.ShiftOrigin(newOrigin);
    }
    BufferMove(proxy) {
        this.m_moveBuffer[this.m_moveCount] = proxy;
        ++this.m_moveCount;
    }
    UnBufferMove(proxy) {
        const i = this.m_moveBuffer.indexOf(proxy);
        this.m_moveBuffer[i] = null;
    }
}
/// This is used to sort pairs.
export function b2PairLessThan(pair1, pair2) {
    if (pair1.proxyA.m_id === pair2.proxyA.m_id) {
        return pair1.proxyB.m_id - pair2.proxyB.m_id;
    }
    return pair1.proxyA.m_id - pair2.proxyA.m_id;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJCcm9hZFBoYXNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vQm94MkQvQ29sbGlzaW9uL2IyQnJvYWRQaGFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUlGLE9BQU8sRUFBYyxhQUFhLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUU1RCxNQUFNLE9BQU8sTUFBTTtJQUNqQixZQUFtQixNQUFxQixFQUFTLE1BQXFCO1FBQW5ELFdBQU0sR0FBTixNQUFNLENBQWU7UUFBUyxXQUFNLEdBQU4sTUFBTSxDQUFlO0lBQUcsQ0FBQztDQUMzRTtBQUVELDRGQUE0RjtBQUM1Rix5RkFBeUY7QUFDekYsb0ZBQW9GO0FBQ3BGLE1BQU0sT0FBTyxZQUFZO0lBQXpCO1FBQ2tCLFdBQU0sR0FBcUIsSUFBSSxhQUFhLEVBQUssQ0FBQztRQUMzRCxpQkFBWSxHQUFXLENBQUMsQ0FBQztRQUNoQyxzQ0FBc0M7UUFDL0IsZ0JBQVcsR0FBVyxDQUFDLENBQUM7UUFDZixpQkFBWSxHQUFnQyxFQUFFLENBQUM7UUFDL0Qsc0NBQXNDO1FBQy9CLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBQ2YsaUJBQVksR0FBcUIsRUFBRSxDQUFDO0lBK0x0RCxDQUFDO0lBOUxDLHFDQUFxQztJQUVyQyxxRUFBcUU7SUFDckUsMEJBQTBCO0lBQ25CLFdBQVcsQ0FBQyxJQUFZLEVBQUUsUUFBVztRQUMxQyxNQUFNLEtBQUssR0FBa0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JFLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELGdFQUFnRTtJQUN6RCxZQUFZLENBQUMsS0FBb0I7UUFDdEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxL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