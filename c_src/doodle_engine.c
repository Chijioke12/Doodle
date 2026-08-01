#include "doodle_engine.h"
#include <stdlib.h>
#include <math.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

static GameState state;

static float rand_float(float min, float max) {
    return min + ((float)rand() / (float)RAND_MAX) * (max - min);
}

EMSCRIPTEN_KEEPALIVE
void init_game(int width, int height) {
    state.world_width = width;
    state.world_height = height;
    state.score = 0;
    state.camera_y = 0.0f;
    state.game_over = false;

    // Reset Player
    state.player.x = width / 2.0f;
    state.player.y = height - 120.0f;
    state.player.vx = 0.0f;
    state.player.vy = -650.0f;
    state.player.facing = 1;
    state.player.powerup_type = 0;
    state.player.powerup_timer = 0.0f;
    state.player.is_shooting = false;
    state.player.is_dead = false;

    // Clear Arrays
    for (int i = 0; i < MAX_PLATFORMS; i++) state.platforms[i].active = false;
    for (int i = 0; i < MAX_ITEMS; i++) state.items[i].active = false;
    for (int i = 0; i < MAX_MONSTERS; i++) state.monsters[i].active = false;
    for (int i = 0; i < MAX_BULLETS; i++) state.bullets[i].active = false;

    // Spawn Starting Platforms
    state.platforms[0] = (Platform){ width / 2.0f, height - 60.0f, 0, 0, PLATFORM_GREEN, true, false };
    state.platforms[1] = (Platform){ width / 2.0f - 80.0f, height - 180.0f, 0, 0, PLATFORM_GREEN, true, false };
    state.platforms[2] = (Platform){ width / 2.0f + 80.0f, height - 300.0f, 100.0f, 0, PLATFORM_BLUE, true, false };
    state.platforms[3] = (Platform){ width / 2.0f - 60.0f, height - 420.0f, 0, 0, PLATFORM_GREEN, true, false };
    state.platforms[4] = (Platform){ width / 2.0f + 60.0f, height - 540.0f, 0, 0, PLATFORM_WHITE, true, false };

    // Initial Spring Item
    state.items[0] = (Item){ width / 2.0f - 80.0f, height - 200.0f, ITEM_SPRING, 1, true };
}

EMSCRIPTEN_KEEPALIVE
GameState* get_game_state() {
    return &state;
}

EMSCRIPTEN_KEEPALIVE
void reset_game() {
    init_game(state.world_width, state.world_height);
}

EMSCRIPTEN_KEEPALIVE
void shoot_bullet() {
    if (state.game_over) return;

    state.player.is_shooting = true;

    for (int i = 0; i < MAX_BULLETS; i++) {
        if (!state.bullets[i].active) {
            state.bullets[i].x = state.player.x;
            state.bullets[i].y = state.player.y - 25.0f;
            state.bullets[i].vy = -900.0f;
            state.bullets[i].active = true;
            break;
        }
    }
}

EMSCRIPTEN_KEEPALIVE
void update_game(float dt, int move_dir, bool shoot_pressed) {
    if (state.game_over) return;

    if (shoot_pressed) {
        shoot_bullet();
    }

    // 1. Horizontal Doodler Physics
    float target_vx = move_dir * 360.0f;
    state.player.vx = target_vx;
    if (move_dir != 0) {
        state.player.facing = move_dir;
    }

    state.player.x += state.player.vx * dt;

    // Screen wrap-around
    if (state.player.x < -20.0f) state.player.x = state.world_width + 20.0f;
    if (state.player.x > state.world_width + 20.0f) state.player.x = -20.0f;

    // Powerup Jetpack/Propeller Logic
    if (state.player.powerup_type > 0) {
        state.player.powerup_timer -= dt;
        if (state.player.powerup_type == ITEM_JETPACK) {
            state.player.vy = -800.0f;
        } else if (state.player.powerup_type == ITEM_PROPELLER) {
            state.player.vy = -650.0f;
        }
        if (state.player.powerup_timer <= 0) {
            state.player.powerup_type = 0;
        }
    } else {
        // Gravity
        state.player.vy += 1200.0f * dt;
    }

    state.player.y += state.player.vy * dt;

    // 2. Platform Collisions (Only when falling)
    if (state.player.vy > 0 && state.player.powerup_type == 0) {
        for (int i = 0; i < MAX_PLATFORMS; i++) {
            Platform* p = &state.platforms[i];
            if (!p->active || p->broken) continue;

            if (state.player.x + 20.0f > p->x - 30.0f &&
                state.player.x - 20.0f < p->x + 30.0f &&
                state.player.y + 30.0f >= p->y - 10.0f &&
                state.player.y + 15.0f <= p->y + 10.0f) {

                if (p->type == PLATFORM_BROWN) {
                    p->broken = true;
                } else {
                    state.player.vy = -650.0f;
                    if (p->type == PLATFORM_WHITE) {
                        p->active = false; // Disappears after 1 bounce
                    }
                }
            }
        }

        // Item Pickups
        for (int i = 0; i < MAX_ITEMS; i++) {
            Item* item = &state.items[i];
            if (!item->active) continue;

            if (state.player.x + 20.0f > item->x - 15.0f &&
                state.player.x - 20.0f < item->x + 15.0f &&
                state.player.y + 30.0f >= item->y - 15.0f &&
                state.player.y - 30.0f <= item->y + 15.0f) {

                if (item->type == ITEM_SPRING) {
                    state.player.vy = -1050.0f;
                } else if (item->type == ITEM_PROPELLER) {
                    state.player.powerup_type = ITEM_PROPELLER;
                    state.player.powerup_timer = 1.8f;
                    item->active = false;
                } else if (item->type == ITEM_JETPACK) {
                    state.player.powerup_type = ITEM_JETPACK;
                    state.player.powerup_timer = 2.2f;
                    item->active = false;
                }
            }
        }
    }

    // Moving Platforms
    for (int i = 0; i < MAX_PLATFORMS; i++) {
        Platform* p = &state.platforms[i];
        if (p->active && p->type == PLATFORM_BLUE) {
            p->x += p->vx * dt;
            if (p->x < 40.0f || p->x > state.world_width - 40.0f) {
                p->vx = -p->vx;
            }
        }
    }

    // 3. Bullets vs Monsters
    for (int b = 0; b < MAX_BULLETS; b++) {
        Bullet* bullet = &state.bullets[b];
        if (!bullet->active) continue;

        bullet->y += bullet->vy * dt;
        if (bullet->y < state.camera_y - 50.0f) {
            bullet->active = false;
            continue;
        }

        for (int m = 0; m < MAX_MONSTERS; m++) {
            Monster* monster = &state.monsters[m];
            if (!monster->active) continue;

            if (bullet->x > monster->x - 25.0f && bullet->x < monster->x + 25.0f &&
                bullet->y > monster->y - 25.0f && bullet->y < monster->y + 25.0f) {
                bullet->active = false;
                monster->active = false;
                state.score += 300;
                break;
            }
        }
    }

    // 4. Player vs Monsters
    if (state.player.powerup_type == 0) {
        for (int m = 0; m < MAX_MONSTERS; m++) {
            Monster* monster = &state.monsters[m];
            if (!monster->active) continue;

            if (state.player.x + 20.0f > monster->x - 25.0f &&
                state.player.x - 20.0f < monster->x + 25.0f &&
                state.player.y + 30.0f > monster->y - 25.0f &&
                state.player.y - 30.0f < monster->y + 25.0f) {

                if (state.player.vy > 0 && state.player.y + 15.0f < monster->y) {
                    // Squish monster
                    monster->active = false;
                    state.player.vy = -650.0f;
                    state.score += 500;
                } else {
                    // Game Over
                    state.game_over = true;
                    state.player.is_dead = true;
                    return;
                }
            }
        }
    }

    // 5. Camera & Score Updates
    float threshold = state.camera_y + 250.0f;
    if (state.player.y < threshold) {
        float delta_y = threshold - state.player.y;
        state.camera_y -= delta_y;
        state.score += (int)delta_y;
    }

    // Fall Offscreen -> Game Over
    if (state.player.y > state.camera_y + state.world_height + 50.0f) {
        state.game_over = true;
        state.player.is_dead = true;
    }
}
