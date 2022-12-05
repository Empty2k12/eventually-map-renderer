'use strict';

// HeaderBlock ========================================

export const HeaderBlock = {
    read(pbf, end) {
        return pbf.readFields(HeaderBlock._readField, {bbox: null, required_features: [], optional_features: [], writingprogram: "", source: "", osmosis_replication_timestamp: 0, osmosis_replication_sequence_number: 0, osmosis_replication_base_url: ""}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.bbox = HeaderBBox.read(pbf, pbf.readVarint() + pbf.pos);
        else if (tag === 4) obj.required_features.push(pbf.readString());
        else if (tag === 5) obj.optional_features.push(pbf.readString());
        else if (tag === 16) obj.writingprogram = pbf.readString();
        else if (tag === 17) obj.source = pbf.readString();
        else if (tag === 32) obj.osmosis_replication_timestamp = pbf.readVarint(true);
        else if (tag === 33) obj.osmosis_replication_sequence_number = pbf.readVarint(true);
        else if (tag === 34) obj.osmosis_replication_base_url = pbf.readString();
    },
    write(obj, pbf) {
        if (obj.bbox) pbf.writeMessage(1, HeaderBBox.write, obj.bbox);
        if (obj.required_features) for (var i = 0; i < obj.required_features.length; i++) pbf.writeStringField(4, obj.required_features[i]);
        if (obj.optional_features) for (i = 0; i < obj.optional_features.length; i++) pbf.writeStringField(5, obj.optional_features[i]);
        if (obj.writingprogram) pbf.writeStringField(16, obj.writingprogram);
        if (obj.source) pbf.writeStringField(17, obj.source);
        if (obj.osmosis_replication_timestamp) pbf.writeVarintField(32, obj.osmosis_replication_timestamp);
        if (obj.osmosis_replication_sequence_number) pbf.writeVarintField(33, obj.osmosis_replication_sequence_number);
        if (obj.osmosis_replication_base_url) pbf.writeStringField(34, obj.osmosis_replication_base_url);
    }
}

// HeaderBBox ========================================

export const HeaderBBox = {
    read(pbf, end) {
        return pbf.readFields(HeaderBBox._readField, {left: 0, right: 0, top: 0, bottom: 0}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.left = pbf.readSVarint();
        else if (tag === 2) obj.right = pbf.readSVarint();
        else if (tag === 3) obj.top = pbf.readSVarint();
        else if (tag === 4) obj.bottom = pbf.readSVarint();
    },
    write(obj, pbf) {
        if (obj.left) pbf.writeSVarintField(1, obj.left);
        if (obj.right) pbf.writeSVarintField(2, obj.right);
        if (obj.top) pbf.writeSVarintField(3, obj.top);
        if (obj.bottom) pbf.writeSVarintField(4, obj.bottom);
    }
}

// PrimitiveBlock ========================================

export const PrimitiveBlock = {
    read(pbf, end) {
        return pbf.readFields(PrimitiveBlock._readField, {stringtable: null, primitivegroup: [], granularity: 100, lat_offset: 0, lon_offset: 0, date_granularity: 1000}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.stringtable = StringTable.read(pbf, pbf.readVarint() + pbf.pos);
        else if (tag === 2) obj.primitivegroup.push(PrimitiveGroup.read(pbf, pbf.readVarint() + pbf.pos));
        else if (tag === 17) obj.granularity = pbf.readVarint(true);
        else if (tag === 19) obj.lat_offset = pbf.readVarint(true);
        else if (tag === 20) obj.lon_offset = pbf.readVarint(true);
        else if (tag === 18) obj.date_granularity = pbf.readVarint(true);
    },
    write(obj, pbf) {
        if (obj.stringtable) pbf.writeMessage(1, StringTable.write, obj.stringtable);
        if (obj.primitivegroup) for (var i = 0; i < obj.primitivegroup.length; i++) pbf.writeMessage(2, PrimitiveGroup.write, obj.primitivegroup[i]);
        if (obj.granularity != undefined && obj.granularity !== 100) pbf.writeVarintField(17, obj.granularity);
        if (obj.lat_offset) pbf.writeVarintField(19, obj.lat_offset);
        if (obj.lon_offset) pbf.writeVarintField(20, obj.lon_offset);
        if (obj.date_granularity != undefined && obj.date_granularity !== 1000) pbf.writeVarintField(18, obj.date_granularity);
    }
}

// PrimitiveGroup ========================================

export const PrimitiveGroup = {
    read(pbf, end) {
        return pbf.readFields(PrimitiveGroup._readField, {nodes: [], dense: null, ways: [], relations: [], changesets: []}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.nodes.push(Node.read(pbf, pbf.readVarint() + pbf.pos));
        else if (tag === 2) obj.dense = DenseNodes.read(pbf, pbf.readVarint() + pbf.pos);
        else if (tag === 3) obj.ways.push(Way.read(pbf, pbf.readVarint() + pbf.pos));
        else if (tag === 4) obj.relations.push(Relation.read(pbf, pbf.readVarint() + pbf.pos));
        else if (tag === 5) obj.changesets.push(ChangeSet.read(pbf, pbf.readVarint() + pbf.pos));
    },
    write(obj, pbf) {
        if (obj.nodes) for (var i = 0; i < obj.nodes.length; i++) pbf.writeMessage(1, Node.write, obj.nodes[i]);
        if (obj.dense) pbf.writeMessage(2, DenseNodes.write, obj.dense);
        if (obj.ways) for (i = 0; i < obj.ways.length; i++) pbf.writeMessage(3, Way.write, obj.ways[i]);
        if (obj.relations) for (i = 0; i < obj.relations.length; i++) pbf.writeMessage(4, Relation.write, obj.relations[i]);
        if (obj.changesets) for (i = 0; i < obj.changesets.length; i++) pbf.writeMessage(5, ChangeSet.write, obj.changesets[i]);
    }
}

// StringTable ========================================

export const StringTable = {
    read(pbf, end) {
        return pbf.readFields(StringTable._readField, {s: []}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.s.push(pbf.readBytes());
    },
    write(obj, pbf) {
        if (obj.s) for (var i = 0; i < obj.s.length; i++) pbf.writeBytesField(1, obj.s[i]);
    }
}

// Info ========================================

export const Info = {
    read(pbf, end) {
        return pbf.readFields(Info._readField, {version: -1, timestamp: 0, changeset: 0, uid: 0, user_sid: 0, visible: false}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.version = pbf.readVarint(true);
        else if (tag === 2) obj.timestamp = pbf.readVarint(true);
        else if (tag === 3) obj.changeset = pbf.readVarint(true);
        else if (tag === 4) obj.uid = pbf.readVarint(true);
        else if (tag === 5) obj.user_sid = pbf.readVarint();
        else if (tag === 6) obj.visible = pbf.readBoolean();
    },
    write(obj, pbf) {
        if (obj.version != undefined && obj.version !== -1) pbf.writeVarintField(1, obj.version);
        if (obj.timestamp) pbf.writeVarintField(2, obj.timestamp);
        if (obj.changeset) pbf.writeVarintField(3, obj.changeset);
        if (obj.uid) pbf.writeVarintField(4, obj.uid);
        if (obj.user_sid) pbf.writeVarintField(5, obj.user_sid);
        if (obj.visible) pbf.writeBooleanField(6, obj.visible);
    }
}

// DenseInfo ========================================

export const DenseInfo = {
    read(pbf, end) {
        return pbf.readFields(DenseInfo._readField, {version: [], timestamp: [], changeset: [], uid: [], user_sid: [], visible: []}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) pbf.readPackedVarint(obj.version, true);
        else if (tag === 2) pbf.readPackedSVarint(obj.timestamp);
        else if (tag === 3) pbf.readPackedSVarint(obj.changeset);
        else if (tag === 4) pbf.readPackedSVarint(obj.uid);
        else if (tag === 5) pbf.readPackedSVarint(obj.user_sid);
        else if (tag === 6) pbf.readPackedBoolean(obj.visible);
    },
    write(obj, pbf) {
        if (obj.version) pbf.writePackedVarint(1, obj.version);
        if (obj.timestamp) pbf.writePackedSVarint(2, obj.timestamp);
        if (obj.changeset) pbf.writePackedSVarint(3, obj.changeset);
        if (obj.uid) pbf.writePackedSVarint(4, obj.uid);
        if (obj.user_sid) pbf.writePackedSVarint(5, obj.user_sid);
        if (obj.visible) pbf.writePackedBoolean(6, obj.visible);
    }
}

// ChangeSet ========================================

export const ChangeSet = {
    read(pbf, end) {
        return pbf.readFields(ChangeSet._readField, {id: 0}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.id = pbf.readVarint(true);
    },
    write(obj, pbf) {
        if (obj.id) pbf.writeVarintField(1, obj.id);
    }
}

// Node ========================================

export const Node = {
    read(pbf, end) {
        return pbf.readFields(_readField, {id: 0, keys: [], vals: [], info: null, lat: 0, lon: 0}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.id = pbf.readSVarint();
        else if (tag === 2) pbf.readPackedVarint(obj.keys);
        else if (tag === 3) pbf.readPackedVarint(obj.vals);
        else if (tag === 4) obj.info = Info.read(pbf, pbf.readVarint() + pbf.pos);
        else if (tag === 8) obj.lat = pbf.readSVarint();
        else if (tag === 9) obj.lon = pbf.readSVarint();
    },
    write(obj, pbf) {
        if (obj.id) pbf.writeSVarintField(1, obj.id);
        if (obj.keys) pbf.writePackedVarint(2, obj.keys);
        if (obj.vals) pbf.writePackedVarint(3, obj.vals);
        if (obj.info) pbf.writeMessage(4, Info.write, obj.info);
        if (obj.lat) pbf.writeSVarintField(8, obj.lat);
        if (obj.lon) pbf.writeSVarintField(9, obj.lon);
    }
}

// DenseNodes ========================================

export const DenseNode = {
    read(pbf, end) {
        return pbf.readFields(DenseNodes._readField, {id: [], denseinfo: null, lat: [], lon: [], keys_vals: []}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) pbf.readPackedSVarint(obj.id);
        else if (tag === 5) obj.denseinfo = DenseInfo.read(pbf, pbf.readVarint() + pbf.pos);
        else if (tag === 8) pbf.readPackedSVarint(obj.lat);
        else if (tag === 9) pbf.readPackedSVarint(obj.lon);
        else if (tag === 10) pbf.readPackedVarint(obj.keys_vals, true);
    },
    write(obj, pbf) {
        if (obj.id) pbf.writePackedSVarint(1, obj.id);
        if (obj.denseinfo) pbf.writeMessage(5, DenseInfo.write, obj.denseinfo);
        if (obj.lat) pbf.writePackedSVarint(8, obj.lat);
        if (obj.lon) pbf.writePackedSVarint(9, obj.lon);
        if (obj.keys_vals) pbf.writePackedVarint(10, obj.keys_vals);
    }
}

// Way ========================================

export const Way = {
    read(pbf, end) {
        return pbf.readFields(Way._readField, {id: 0, keys: [], vals: [], info: null, refs: [], lat: [], lon: []}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.id = pbf.readVarint(true);
        else if (tag === 2) pbf.readPackedVarint(obj.keys);
        else if (tag === 3) pbf.readPackedVarint(obj.vals);
        else if (tag === 4) obj.info = Info.read(pbf, pbf.readVarint() + pbf.pos);
        else if (tag === 8) pbf.readPackedSVarint(obj.refs);
        else if (tag === 9) pbf.readPackedSVarint(obj.lat);
        else if (tag === 10) pbf.readPackedSVarint(obj.lon);
    },
    write(obj, pbf) {
        if (obj.id) pbf.writeVarintField(1, obj.id);
        if (obj.keys) pbf.writePackedVarint(2, obj.keys);
        if (obj.vals) pbf.writePackedVarint(3, obj.vals);
        if (obj.info) pbf.writeMessage(4, Info.write, obj.info);
        if (obj.refs) pbf.writePackedSVarint(8, obj.refs);
        if (obj.lat) pbf.writePackedSVarint(9, obj.lat);
        if (obj.lon) pbf.writePackedSVarint(10, obj.lon);
    }
}

// Relation ========================================

export const Relation = {
    read(pbf, end) {
        return pbf.readFields(Relation._readField, {id: 0, keys: [], vals: [], info: null, roles_sid: [], memids: [], types: []}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.id = pbf.readVarint(true);
        else if (tag === 2) pbf.readPackedVarint(obj.keys);
        else if (tag === 3) pbf.readPackedVarint(obj.vals);
        else if (tag === 4) obj.info = Info.read(pbf, pbf.readVarint() + pbf.pos);
        else if (tag === 8) pbf.readPackedVarint(obj.roles_sid, true);
        else if (tag === 9) pbf.readPackedSVarint(obj.memids);
        else if (tag === 10) pbf.readPackedVarint(obj.types);
    },
    write(obj, pbf) {
        if (obj.id) pbf.writeVarintField(1, obj.id);
        if (obj.keys) pbf.writePackedVarint(2, obj.keys);
        if (obj.vals) pbf.writePackedVarint(3, obj.vals);
        if (obj.info) pbf.writeMessage(4, Info.write, obj.info);
        if (obj.roles_sid) pbf.writePackedVarint(8, obj.roles_sid);
        if (obj.memids) pbf.writePackedSVarint(9, obj.memids);
        if (obj.types) pbf.writePackedVarint(10, obj.types);
    }
}

Relation.MemberType = {
    "NODE": {
        "value": 0,
        "options": {}
    },
    "WAY": {
        "value": 1,
        "options": {}
    },
    "RELATION": {
        "value": 2,
        "options": {}
    }
};
