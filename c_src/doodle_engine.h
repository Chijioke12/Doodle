#ifndef DOODLE_ENGINE_H
#define DOODLE_ENGINE_H

#include <stdint.h>
#include <stdbool.h>

#define MAX_PLATFORMS 32
#define MAX_MONSTERS 8
#define MAX_BULLETS 16
#define MAX_ITEMS 8

#define PLATFORM_GREEN 0
#define PLATFORM_BLUE 1
#define PLATFORM_WHITE 2
#define PLATFORM_BROWN 3

#define ITEM_NONE 0
#define ITEM_SPRING 1
#define ITEM_PROPELLER 2
#define ITEM_JETPACK 3

#define MONSTER_PURPLE 1
#define MONSTER_GREEN_FLYING 2

typedef struct {
    float x;
    float y;
    float vx;
    float vy;
    int type; // 0: green, 1: blue (moving), 2: white (disappearing), 3: brown (broken)
    bool active;
    bool broken;
} Platform;

typedef struct {
    float x;
    float y;
    int type; // 1: spring, 2: propeller, 3: jetpack
    int platform_idx;
    bool active;
} Item;

typedef struct {
    float x;
    float y;
    float vx;
    int type;
    bool active;
} Monster;

typedef struct {
    float x;
    float y;
    float vy;
    bool active;
} Bullet;

typedef struct {
    float x;
    float y;
    float vx;
    float vy;
    int facing; // -1: left, 1: right
    int powerup_type; // 0: none, 2: propeller, 3: jetpack
    float powerup_timer;
    bool is_shooting;
    bool is_dead;
} Doodler;

typedef struct {
    Doodler player;
    Platform platforms[MAX_PLATFORMS];
    Item items[MAX_ITEMS];
    Monster monsters[MAX_MONSTERS];
    Bullet bullets[MAX_BULLETS];
    int score;
    int high_score;
    float camera_y;
    int world_width;
    int world_height;
    bool game_over;
} GameState;

// C Engine API Functions
void init_game(int width, int height);
void update_game(float delta_time, int move_dir, bool shoot_pressed);
GameState* get_game_state();
void reset_game();
void shoot_bullet();

#endif // DOODLE_ENGINE_H
