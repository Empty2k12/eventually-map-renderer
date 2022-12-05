'use strict';

// Blob ========================================

var Blob = exports.Blob = {};

export const Blob = {
    read(pbf, end) {
        return pbf.readFields(Blob._readField, {raw_size: 0, raw: null, data: null, zlib_data: null, lzma_data: null, OBSOLETE_bzip2_data: null, lz4_data: null, zstd_data: null}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 2) obj.raw_size = pbf.readVarint(true);
        else if (tag === 1) obj.raw = pbf.readBytes(), obj.data = "raw";
        else if (tag === 3) obj.zlib_data = pbf.readBytes(), obj.data = "zlib_data";
        else if (tag === 4) obj.lzma_data = pbf.readBytes(), obj.data = "lzma_data";
        else if (tag === 5) obj.OBSOLETE_bzip2_data = pbf.readBytes(), obj.data = "OBSOLETE_bzip2_data";
        else if (tag === 6) obj.lz4_data = pbf.readBytes(), obj.data = "lz4_data";
        else if (tag === 7) obj.zstd_data = pbf.readBytes(), obj.data = "zstd_data";
    },
    write(obj, pbf) {
        if (obj.raw_size) pbf.writeVarintField(2, obj.raw_size);
        if (obj.raw) pbf.writeBytesField(1, obj.raw);
        if (obj.zlib_data) pbf.writeBytesField(3, obj.zlib_data);
        if (obj.lzma_data) pbf.writeBytesField(4, obj.lzma_data);
        if (obj.OBSOLETE_bzip2_data) pbf.writeBytesField(5, obj.OBSOLETE_bzip2_data);
        if (obj.lz4_data) pbf.writeBytesField(6, obj.lz4_data);
        if (obj.zstd_data) pbf.writeBytesField(7, obj.zstd_data);
    }
}

// BlobHeader ========================================

export const BlobHeader = {
    read(pbf, end) {
        return pbf.readFields(BlobHeader._readField, {type: "", indexdata: null, datasize: 0}, end);
    },
    _readField(tag, obj, pbf) {
        if (tag === 1) obj.type = pbf.readString();
        else if (tag === 2) obj.indexdata = pbf.readBytes();
        else if (tag === 3) obj.datasize = pbf.readVarint(true);
    },
    write(obj, pbf) {
        if (obj.type) pbf.writeStringField(1, obj.type);
        if (obj.indexdata) pbf.writeBytesField(2, obj.indexdata);
        if (obj.datasize) pbf.writeVarintField(3, obj.datasize);
    }
}