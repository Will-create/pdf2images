FUNC.log = function(id, payload, upd) {
    var builder = NOSQL('logs');
    
    if (upd) {
        payload.dtupdated = NOW;
        builder.update(payload).id(id).callback(NOOP);
    } else {
        payload.id = id;
        payload.dtcreated = NOW;
        payload.success = false;
        payload.value = {};
        payload.meta = {};
        builder.insert(payload).callback(NOOP);
    }

}