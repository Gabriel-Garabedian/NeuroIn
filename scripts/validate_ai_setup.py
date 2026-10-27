"""Validate the repository's portable AI configuration with Python 3.11+."""

from pathlib import Path
import json
import re
import subprocess
import sys
import tomllib


def validate(root: Path) -> tuple[int, int]:
    skills = sorted((root / '.agents/skills').glob('*/SKILL.md'))
    assert len(skills) == 25, f'Expected 25 skills, found {len(skills)}'
    names = []
    for path in skills:
        text = path.read_text(encoding='utf-8')
        parts = text.split('---', 2)
        assert len(parts) == 3 and not parts[0], f'Invalid frontmatter: {path}'
        fields = parts[1]
        name = re.search(r'^name:\s*[\"\x27]?([a-z0-9-]+)', fields, re.M)
        assert name and name[1] == path.parent.name, f'Invalid skill name: {path}'
        assert re.search(r'^description:\s*\S+', fields, re.M), path
        names.append(name[1])
        for target in re.findall(r'\]\(([^)]+)\)', text):
            if re.match(r'^(https?://|#|mailto:)', target):
                continue
            target = target.split('#', 1)[0]
            if target and not any(char in target for char in '<>{} '):
                assert (path.parent / target).exists(), (path, target)
    assert len(names) == len(set(names)), 'Duplicate skill names'

    agents = sorted((root / '.codex/agents').glob('*.toml'))
    assert len(agents) == 283, f'Expected 283 agents, found {len(agents)}'
    names = []
    catalog = (root / '.agents/skills/agency-agents/references/catalog.md').read_text(encoding='utf-8')
    for path in agents:
        data = tomllib.loads(path.read_text(encoding='utf-8'))
        for key in ('name', 'description', 'developer_instructions'):
            assert isinstance(data.get(key), str) and data[key].strip(), (path, key)
        names.append(data['name'])
        assert f'`{path.name}`' in catalog, f'Missing catalog entry: {path.name}'
    assert len(names) == len(set(names)), 'Duplicate agent names'

    ui = root / '.agents/skills/ui-ux-pro-max'
    assert 'CLAUDE_PLUGIN_ROOT' not in (ui / 'SKILL.md').read_text(encoding='utf-8')
    result = subprocess.run(
        [sys.executable, str(ui / 'scripts/search.py'), 'keyboard focus modal',
         '--domain', 'ux', '--json'],
        cwd=root, check=True, capture_output=True, text=True, encoding='utf-8',
    )
    data = json.loads(result.stdout)
    assert data.get('results'), 'UI/UX search returned no results'
    return len(skills), len(agents)


if __name__ == '__main__':
    skill_count, agent_count = validate(Path(__file__).resolve().parents[1])
    print(f'OK: {skill_count} skills, {agent_count} agents, catalog and UI/UX search.')
