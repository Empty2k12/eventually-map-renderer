export const areaColor = (way) => {
    if(way.tags.building) {
        return 0.5;
    }

    if(way.tags.leisure === "park" || way.tags.natural === "scrub" || ["grass", "forest"].includes(way.tags.landuse)) {
        return 0.8;
    }

    return 1;
}


export const wayColor = (way) => {
    if(["primary", "primary_link"].includes(way.tags.highway)) {
        return [0.98823529, 0.83921569, 0.64313725];
    }

    if(["residential", "secondary", "tertiary", "tertiary_link", "living_street", "unclassified", "pedestrian"].includes(way.tags.highway)) {
        return [1, 1, 1];
    }

    if(["footway", "steps", "cycleway"].includes(way.tags.highway)) {
        return [0.95294118, 0.60392157, 0.54117647];
    }

    if(way.tags.highway === "service") {
        return [0.85,0.85,0.85];
    }

    return [0,0,0];
}
  
export const wayWidth = (way) => {
    if(["primary"].includes(way.tags.highway)) {
        return 18;
    }

    if(["residential", "secondary", "tertiary", "tertiary_link", "living_street", "primary_link"].includes(way.tags.highway)) {
        return 12;
    }

    if(["footway", "steps"].includes(way.tags.highway)) {
        return 2;
    }

    if(["service", "pedestrian"].includes(way.tags.highway)) {
        return 7;
    }

    if(["rail"].includes(way.tags.railway)) {
        return 3;
    }

    return 7;
}