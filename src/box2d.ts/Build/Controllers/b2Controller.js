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
/**
 * A controller edge is used to connect bodies and controllers
 * together in a bipartite graph.
 */
export class b2ControllerEdge {
    constructor(controller, body) {
        this.prevBody = null; ///< the previous controller edge in the controllers's joint list
        this.nextBody = null; ///< the next controller edge in the controllers's joint list
        this.prevController = null; ///< the previous controller edge in the body's joint list
        this.nextController = null; ///< the next controller edge in the body's joint list
        this.controller = controller;
        this.body = body;
    }
}
/**
 * Base class for controllers. Controllers are a convience for
 * encapsulating common per-step functionality.
 */
export class b2Controller {
    constructor() {
        // m_world: b2World;
        this.m_bodyList = null;
        this.m_bodyCount = 0;
        this.m_prev = null;
        this.m_next = null;
    }
    /**
     * Get the next controller in the world's body list.
     */
    GetNext() {
        return this.m_next;
    }
    /**
     * Get the previous controller in the world's body list.
     */
    GetPrev() {
        return this.m_prev;
    }
    /**
     * Get the parent world of this body.
     */
    // GetWorld() {
    //   return this.m_world;
    // }
    /**
     * Get the attached body list
     */
    GetBodyList() {
        return this.m_bodyList;
    }
    /**
     * Adds a body to the controller list.
     */
    AddBody(body) {
        const edge = new b2ControllerEdge(this, body);
        //Add edge to controller list
        edge.nextBody = this.m_bodyList;
        edge.prevBody = null;
        if (this.m_bodyList) {
            this.m_bodyList.prevBody = edge;
        }
        this.m_bodyList = edge;
        ++this.m_bodyCount;
        //Add edge to body list
        edge.nextController = body.m_controllerList;
        edge.prevController = null;
        if (body.m_controllerList) {
            body.m_controllerList.prevController = edge;
        }
        body.m_controllerList = edge;
        ++body.m_controllerCount;
    }
    /**
     * Removes a body from the controller list.
     */
    RemoveBody(body) {
        //Assert that the controller is not empty
        if (this.m_bodyCount <= 0) {
            throw new Error();
        }
        //Find the corresponding edge
        /*b2ControllerEdge*/
        let edge = this.m_bodyList;
        while (edge && edge.body !== body) {
            edge = edge.nextBody;
        }
        //Assert that we are removing a body that is currently attached to the controller
        if (edge === null) {
            throw new Error();
        }
        //Remove edge from controller list
        if (edge.prevBody) {
            edge.prevBody.nextBody = edge.nextBody;
        }
        if (edge.nextBody) {
            edge.nextBody.prevBody = edge.prevBody;
        }
        if (this.m_bodyList === edge) {
            this.m_bodyList = edge.nextBody;
        }
        --this.m_bodyCount;
        //Remove edge from body list
        if (edge.nextController) {
            edge.nextController.prevController = edge.prevController;
        }
        if (edge.prevController) {
            edge.prevController.nextController = edge.nextController;
        }
        if (body.m_controllerList === edge) {
            body.m_controllerList = edge.nextController;
        }
        --body.m_controllerCount;
    }
    /**
     * Removes all bodies from the controller list.
     */
    Clear() {
        while (this.m_bodyList) {
            this.RemoveBody(this.m_bodyList.body);
        }
        this.m_bodyCount = 0;
    }
}
// #endif
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vQm94MkQvQ29udHJvbGxlcnMvYjJDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBUUg7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQU8zQixZQUFZLFVBQXdCLEVBQUUsSUFBWTtRQUozQyxhQUFRLEdBQTRCLElBQUksQ0FBQyxDQUFDLGlFQUFpRTtRQUMzRyxhQUFRLEdBQTRCLElBQUksQ0FBQyxDQUFDLDZEQUE2RDtRQUN2RyxtQkFBYyxHQUE0QixJQUFJLENBQUMsQ0FBQywwREFBMEQ7UUFDMUcsbUJBQWMsR0FBNEIsSUFBSSxDQUFDLENBQUMsc0RBQXNEO1FBRTNHLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILE1BQU0sT0FBZ0IsWUFBWTtJQUFsQztRQUNFLG9CQUFvQjtRQUNiLGVBQVUsR0FBNEIsSUFBSSxDQUFDO1FBQzNDLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBQ3hCLFdBQU0sR0FBd0IsSUFBSSxDQUFDO1FBQ25DLFdBQU0sR0FBd0IsSUFBSSxDQUFDO0lBcUg1QyxDQUFDO0lBekdDOztPQUVHO0lBQ0ksT0FBTztRQUNaLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQ7O09BRUc7SUFDSSxPQUFPO1FBQ1osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7T0FFRztJQUNILGVBQWU7SUFDZix5QkFBeUI7SUFDekIsSUFBSTtJQUVKOztPQUVHO0lBQ0ksV0FBVztRQUNoQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0ksT0FBTyxDQUFDLElBQVk7UUFDekIsTUFBTSxJQUFJLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFOUMsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUNoQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUNyQixJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1NBQ2pDO1FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdkIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDO1FBRW5CLHVCQUF1QjtRQUN2QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztRQUM1QyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUMzQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUN6QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztTQUM3QztRQUNELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDN0IsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUM7SUFDM0IsQ0FBQztJQUVEOztPQUVHO0lBQ0ksVUFBVSxDQUFDLElBQVk7UUFDNUIseUNBQXlDO1FBQ3pDLElBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLEVBQUU7WUFBRSxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7U0FBRTtRQUVqRCw2QkFBNkI7UUFDN0Isb0JBQW9CO1FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDM0IsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDakMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7U0FDdEI7UUFFRCxpRkFBaUY7UUFDakYsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO1lBQUUsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO1NBQUU7UUFFekMsa0NBQWtDO1FBQ2xDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1NBQ3hDO1FBQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7U0FDeEM7UUFDRCxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxFQUFFO1lBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztTQUNqQztRQUNELEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUVuQiw0QkFBNEI7UUFDNUIsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7U0FDMUQ7UUFDRCxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDdkIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztTQUMxRDtRQUNELElBQUksSUFBSSxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRTtZQUNsQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztTQUM3QztRQUNELEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDO0lBQzNCLENBQUM7SUFFRDs7T0FFRztJQUNJLEtBQUs7UUFDVixPQUFPLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDdEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZDO1FBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7SUFDdkIsQ0FBQztDQUNGO0FBRUQsU0FBUyJ9