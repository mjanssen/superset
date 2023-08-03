/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import React from 'react';
import { t, CategoricalColorNamespace } from '@superset-ui/core';

import { commonLayerProps, getAggFunc } from '../common';
import sandboxedEval from '../../utils/sandbox';
import { hexToRGB } from '../../utils/colors';
import { createDeckGLComponent } from '../../factory';
import TooltipRow from '../../TooltipRow';

function setTooltipContent(o) {
  return (
    <div className="deckgl-tooltip">
      <TooltipRow
        label={t('Hex: ')}
        value={`(${o.object.hex})`}
      />
      <TooltipRow
        label={t('Count: ')}
        value={`${o.object.count}`}
      />
    </div>
  );
}

export function getLayer(formData, payload, onAddFilter, setTooltip) {
  const fd = formData;
  const colorScale = CategoricalColorNamespace.getScale(fd.color_scheme);
  const colorRange = colorScale.range().map(color => hexToRGB(color));
  let data = payload.data.features;

  if (fd.js_data_mutator) {
    // Applying user defined data mutator if defined
    const jsFnMutator = sandboxedEval(fd.js_data_mutator);
    data = jsFnMutator(data);
  }

  const aggFunc = getAggFunc(fd.js_agg_function, p => p.weight);

  return new H3HexagonLayer({
    id: `h3-hexagon-layer-${fd.slice_id}`,
    data,
    pickable: true,
    wireframe: false,
    filled: true,
    extruded: fd.extruded,
    elevationScale: 20,
    getHexagon: d => d.hex,
    getFillColor: d => [255, (1 - d.count / 500) * 255, 0],
    getElevation: d => d.count,
    ...commonLayerProps(fd, setTooltip, setTooltipContent),
  });
}

// Formdata is required since we don't know where hex-es are located
function getPoints(_, formData) {
  if (formData.viewport) {
    return [formData.viewport.longitude, formData.viewport.latitude];
  }
  
  return [];
}

export default createDeckGLComponent(getLayer, getPoints);
