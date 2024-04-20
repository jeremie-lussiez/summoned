import RAPIER from "@dimforge/rapier2d-compat";

const SUCK_STRENGTH = 1.5;

export const SUMMONED_BY_PORTAL_STATE_DEFINITION = {
    id: 'summonedByPortal',
    data: {
        darken: 1,
    },
    actions: {
        suck: (game: any, state: any) => {
            game.suckableThings.forEach((mesh) => {
                if (mesh.userData) {
                    const body = mesh.userData as RAPIER.RigidBody;
                    let suckAngle = Math.atan2(
                        game.portalMesh.position.y - body.translation().y,
                        game.portalMesh.position.x - body.translation().x
                    );
                    const massFactor = body.mass() / 7;
                    let suckForce = {
                        x: Math.cos(suckAngle) * SUCK_STRENGTH * massFactor,
                        y: Math.sin(suckAngle) * SUCK_STRENGTH * massFactor,
                    };
                    body.applyImpulse(suckForce, true);
                    let distance = Math.sqrt(
                        Math.pow(game.portalMesh.position.x - body.translation().x, 2) +
                        Math.pow(game.portalMesh.position.y - body.translation().y, 2)
                    );
                    if (distance < 5) {
                        // game.world.removeCollider(body.collider(0), true);
                        // game.world.removeRigidBody(body);
                        mesh.visible = false;
                        mesh.userData = null;
                    }
                }
            });

            game.summonsContainerDiv.style.display = 'none';
        }
    },
    update: (game: any, state: any, delta: number) => {
        game.roomMesh.material.opacity = state.darken;
        state.darken -= delta * 0.0005;
        state.darken = Math.max(0, Math.min(1, state.darken));
        game.suckableThings.forEach((summonsDocument) => {
            const distanceToPortal = game.portalMesh.position.distanceTo(summonsDocument.position);
            if (distanceToPortal < 10) {
                summonsDocument.material.opacity = 1 - distanceToPortal / 10;
            } else {
                summonsDocument.material.opacity = 1;
            }
            if (distanceToPortal < 3) {
                summonsDocument.visible = false;
            }
            if (summonsDocument.userData) {
                summonsDocument.position.y = summonsDocument.userData.translation().y;
                summonsDocument.position.x = summonsDocument.userData.translation().x;
                summonsDocument.rotation.z = summonsDocument.userData.rotation();
            }
        });
    },
    init: (game: any, state: any) => {
        game.ceilingCollider.setCollisionGroups(0x00000000);
        game.progressDiv.style.display = 'none';
        game.portalMesh.visible = true;
        game.summonsContainerDiv.style.display = 'none';
        if (!game.suckableThings.find(mesh => mesh === game.playerMesh)) {
            game.suckableThings.push(game.playerMesh);
        }
    },
    transitions: [
        {
            condition: (game: any, state: any) => {
                return game.playerMesh.visible === false;
            },
            target: 'hasBeenSummoned'
        }
    ]
};